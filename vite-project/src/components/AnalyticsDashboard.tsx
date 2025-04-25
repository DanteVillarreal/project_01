import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { supabase } from '../services/supabase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VisitorData {
  date: string;
  count: number;
}

interface ClickData {
  element_id: string;
  count: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [visitorData, setVisitorData] = useState<VisitorData[]>([]);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch visitor data grouped by date
        const { data: visitors, error: visitorError } = await supabase
          .from('visitors')
          .select('created_at')
          .order('created_at');

        if (visitorError) throw visitorError;

        // Process visitor data
        const visitorCounts = visitors?.reduce((acc: { [key: string]: number }, curr) => {
          const date = new Date(curr.created_at).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const processedVisitorData = Object.entries(visitorCounts || {}).map(([date, count]) => ({
          date,
          count,
        }));

        // Fetch click data with raw SQL query for proper grouping
        const { data: clicks, error: clickError } = await supabase
          .rpc('get_top_clicked_elements', { limit_count: 10 });

        if (clickError) throw clickError;

        setVisitorData(processedVisitorData);
        setClickData(clicks || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const visitorChartData = {
    labels: visitorData.map(d => d.date),
    datasets: [
      {
        label: 'Daily Visitors',
        data: visitorData.map(d => d.count),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading analytics...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Visitor Trends</h2>
          <div className="h-[300px]">
            <Line data={visitorChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Most Clicked Elements</h2>
          <div className="space-y-4">
            {clickData.map((click) => (
              <div key={click.element_id} className="flex justify-between items-center">
                <span className="font-medium">{click.element_id || 'No ID'}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {click.count} clicks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
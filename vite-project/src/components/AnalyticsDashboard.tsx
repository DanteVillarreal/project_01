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
  const [realtimeStats, setRealtimeStats] = useState({
    activeVisitors: 0,
    totalClicks: 0,
  });

  // Function to process visitor data
  const processVisitorData = (visitors: any[]) => {
    const visitorCounts = visitors.reduce((acc: { [key: string]: number }, curr) => {
      const date = new Date(curr.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(visitorCounts).map(([date, count]) => ({
      date,
      count,
    }));
  };

  // Initial data fetch
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch visitor data
        const { data: visitors, error: visitorError } = await supabase
          .from('visitors')
          .select('created_at')
          .order('created_at');

        if (visitorError) throw visitorError;

        // Fetch click data
        const { data: clicks, error: clickError } = await supabase
          .rpc('get_top_clicked_elements', { limit_count: 10 });

        if (clickError) throw clickError;

        // Get active visitors (sessions created in last 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { count: activeVisitors } = await supabase
          .from('visitors')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyMinutesAgo);

        // Get total clicks in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentClicks } = await supabase
          .from('click_events')
          .select('id', { count: 'exact' })
          .gte('created_at', oneHourAgo);

        setVisitorData(processVisitorData(visitors || []));
        setClickData(clicks || []);
        setRealtimeStats({
          activeVisitors: activeVisitors || 0,
          totalClicks: recentClicks || 0,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new visitors
    const visitorSubscription = supabase
      .channel('visitors')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'visitors',
      }, async (payload) => {
        // Update visitor data
        const { data: visitors } = await supabase
          .from('visitors')
          .select('created_at')
          .order('created_at');
        
        setVisitorData(processVisitorData(visitors || []));
        
        // Update active visitors count
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('visitors')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyMinutesAgo);
        
        setRealtimeStats(prev => ({
          ...prev,
          activeVisitors: count || prev.activeVisitors,
        }));
      })
      .subscribe();

    // Subscribe to new clicks
    const clickSubscription = supabase
      .channel('clicks')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'click_events',
      }, async (payload) => {
        // Update click data
        const { data: clicks } = await supabase
          .rpc('get_top_clicked_elements', { limit_count: 10 });
        
        setClickData(clicks || []);
        
        // Update total clicks count
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('click_events')
          .select('id', { count: 'exact' })
          .gte('created_at', oneHourAgo);
        
        setRealtimeStats(prev => ({
          ...prev,
          totalClicks: count || prev.totalClicks,
        }));
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      visitorSubscription.unsubscribe();
      clickSubscription.unsubscribe();
    };
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
      
      {/* Real-time stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-blue-800">Active Visitors</h3>
          <p className="text-3xl font-bold text-blue-600">{realtimeStats.activeVisitors}</p>
          <p className="text-sm text-blue-500">In the last 30 minutes</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-green-800">Recent Clicks</h3>
          <p className="text-3xl font-bold text-green-600">{realtimeStats.totalClicks}</p>
          <p className="text-sm text-green-500">In the last hour</p>
        </div>
      </div>

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
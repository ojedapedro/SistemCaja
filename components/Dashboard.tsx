import React, { useMemo } from 'react';
import { Sale } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalTransactions = sales.length;
    const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Monthly sales data for chart
    const salesByMonth = sales.reduce((acc, sale) => {
      const date = new Date(sale.date);
      // Fallback for invalid dates
      if (isNaN(date.getTime())) return acc;
      
      const month = date.toLocaleString('es-ES', { month: 'short' });
      acc[month] = (acc[month] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(salesByMonth).map(month => ({
      name: month,
      ventas: salesByMonth[month]
    }));

    // Find best sellers
    const productSales: Record<string, number> = {};
    sales.forEach(sale => {
        // Safe check for items array
        if(Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
            });
        }
    });
    
    const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

    return { totalRevenue, totalTransactions, avgTicket, chartData, topProducts };
  }, [sales]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Control</h2>
        <span className="text-sm text-gray-500">Vista General</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Ventas Totales" 
            value={`$${stats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
            icon={DollarSign} 
            color="bg-green-500" 
        />
        <StatCard 
            title="Transacciones" 
            value={stats.totalTransactions} 
            icon={ShoppingBag} 
            color="bg-blue-500" 
        />
        <StatCard 
            title="Ticket Promedio" 
            value={`$${stats.avgTicket.toFixed(2)}`} 
            icon={TrendingUp} 
            color="bg-purple-500" 
        />
        <StatCard 
            title="Productos Top" 
            value={stats.topProducts.length} 
            icon={AlertCircle} 
            color="bg-orange-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Ventas</h3>
          {/* Explicit height style is critical to prevent Recharts -1 width error */}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData.length > 0 ? stats.chartData : [{name: 'Sin datos', ventas: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lo Más Vendido</h3>
          <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.topProducts.length > 0 ? stats.topProducts : [{name: 'Sin datos', quantity: 0}]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="quantity" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
            </ResponsiveContainer>
          </div>
           <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {stats.topProducts.map((p, idx) => (
                    <li key={idx} className="flex justify-between text-sm text-gray-600 border-b pb-1 last:border-0">
                        <span className="truncate pr-2">{idx + 1}. {p.name}</span>
                        <span className="font-semibold whitespace-nowrap">{p.quantity} un.</span>
                    </li>
                ))}
                {stats.topProducts.length === 0 && <p className="text-center text-gray-400 text-sm">No hay suficientes datos de ventas.</p>}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
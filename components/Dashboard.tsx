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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-all duration-300 hover:shadow-md group">
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 mb-1 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform shadow-inner`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-slate-100 tracking-tight">Panel de Control</h2>
            <p className="text-sm text-gray-500 dark:text-slate-500 uppercase tracking-widest font-bold">Vista General del Negocio</p>
        </div>
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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden min-w-0 transition-colors duration-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Tendencia de Ventas
          </h3>
          {/* Explicit height style is critical to prevent Recharts -1 width error */}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData.length > 0 ? stats.chartData : [{name: 'Sin datos', ventas: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9', opacity: 0.1}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#0f172a', color: '#f1f5f9'}}
                    itemStyle={{color: '#3b82f6', fontWeight: 'bold'}}
                />
                <Bar dataKey="ventas" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden min-w-0 transition-colors duration-300">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-indigo-500" />
              Lo Más Vendido
          </h3>
          <div style={{ width: '100%', height: 250 }}>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.topProducts.length > 0 ? stats.topProducts : [{name: 'Sin datos', quantity: 0}]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="dark:opacity-5" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#f1f5f9'}} />
                    <Line type="monotone" dataKey="quantity" stroke="#6366f1" strokeWidth={3} dot={{r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 7}} />
                </LineChart>
            </ResponsiveContainer>
          </div>
           <ul className="mt-6 space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {stats.topProducts.map((p, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm text-gray-600 dark:text-slate-400 border-b border-gray-50 dark:border-slate-800/50 pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                            <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">{idx + 1}</span>
                            <span className="truncate max-w-[150px] font-medium">{p.name}</span>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-slate-200 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded text-xs">{p.quantity} un.</span>
                    </li>
                ))}
                {stats.topProducts.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No hay suficientes datos de ventas.</p>}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
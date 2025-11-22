import React from 'react';
import { useCRM } from '../context/CRMContext';
import { TrendingUp, Users, MessageCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { leads } = useCRM();

  // Metrics calculation
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.status === 'Quente').length;
  const coldLeads = leads.filter(l => l.status === 'Frio').length;
  const unreadMessages = leads.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const StatCard = ({ title, value, icon: Icon, color, sub }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          <p className={`text-xs mt-2 ${sub.includes('+') ? 'text-green-500' : 'text-gray-400'}`}>{sub}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const chartData = [
    { name: 'Seg', leads: 4 },
    { name: 'Ter', leads: 3 },
    { name: 'Qua', leads: 7 },
    { name: 'Qui', leads: 5 },
    { name: 'Sex', leads: 8 },
    { name: 'Sáb', leads: 6 },
    { name: 'Dom', leads: 2 },
  ];

  const pieData = [
    { name: 'Quente', value: hotLeads },
    { name: 'Morno', value: leads.filter(l => l.status === 'Morno').length },
    { name: 'Frio', value: coldLeads },
    { name: 'Novo', value: leads.filter(l => l.status === 'Novo').length },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
        <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
          Atualizado agora
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Leads" 
          value={totalLeads} 
          icon={Users} 
          color="bg-blue-500" 
          sub="+12% este mês"
        />
        <StatCard 
          title="Leads Quentes" 
          value={hotLeads} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
          sub="Alta probabilidade"
        />
        <StatCard 
          title="Mensagens Não Lidas" 
          value={unreadMessages} 
          icon={MessageCircle} 
          color="bg-orange-500" 
          sub="Requer atenção"
        />
        <StatCard 
          title="Leads Frios" 
          value={coldLeads} 
          icon={AlertCircle} 
          color="bg-red-500" 
          sub="Necessário follow-up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Atividade Semanal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">Temperatura dos Leads</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
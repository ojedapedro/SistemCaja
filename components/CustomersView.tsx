import React, { useState } from 'react';
import { Customer } from '../types';
import { Plus, User, Phone, Mail, MapPin } from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
}

const CustomersView: React.FC<CustomersViewProps> = ({ customers, onAddCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
      name: '',
      email: '',
      phone: '',
      address: ''
  });

  const handleSubmit = () => {
      if (!newCustomer.name) return;
      onAddCustomer({
          id: Date.now().toString(),
          ...newCustomer
      });
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Cartera de Clientes</h2>
                <p className="text-gray-500">Administra la información de tus clientes.</p>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
                <Plus size={20} /> Nuevo Cliente
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map(customer => (
                <div key={customer.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <User size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{customer.name}</h3>
                            <p className="text-xs text-gray-400">ID: {customer.id}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <span>{customer.email || 'Sin correo'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-400" />
                            <span>{customer.phone || 'Sin teléfono'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="truncate">{customer.address || 'Sin dirección'}</span>
                        </div>
                    </div>
                </div>
            ))}
            {customers.length === 0 && (
                <div className="col-span-full text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                    No hay clientes registrados.
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">Registrar Cliente</h3>
                    <div className="space-y-3">
                        <input className="w-full border p-2 rounded" placeholder="Nombre Completo" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Correo Electrónico" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Teléfono" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                        <input className="w-full border p-2 rounded" placeholder="Dirección" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancelar</button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CustomersView;
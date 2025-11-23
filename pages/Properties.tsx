

import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { Property, PropertyUnit } from '../types';
import { Edit2, MapPin, Home, Save, Plus, Image as ImageIcon, Film, Layout, Trash2, Upload, Grid, BedDouble, Bath, Loader2, ArrowRight, ImageOff } from 'lucide-react';

const Properties: React.FC = () => {
  const { properties, updateProperty, addProperty } = useCRM();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Property>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'units'>('info');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);
  const unitImageInputRef = useRef<HTMLInputElement>(null);

  const [newUnit, setNewUnit] = useState<Partial<PropertyUnit>>({ bedrooms: 2, bathrooms: 1 });

  const handleEditClick = (property: Property) => {
    setEditingId(property.id);
    setEditForm({
        ...property,
        images: property.images || [],
        videos: property.videos || [],
        floorPlans: property.floorPlans || [],
        units: property.units || []
    });
    setIsAdding(false);
    setActiveTab('info');
  };

  const handleSave = () => {
    if (isAdding) {
        const newProp = {
            ...editForm,
            id: Date.now().toString(),
            features: editForm.features || [],
            imageUrl: editForm.imageUrl || "https://via.placeholder.com/800x600?text=Sem+Imagem",
            images: editForm.images || [],
            videos: editForm.videos || [],
            floorPlans: editForm.floorPlans || [],
            units: editForm.units || [],
            type: editForm.type || 'Casa'
        } as Property;
        addProperty(newProp);
        setIsAdding(false);
    } else if (editingId && editForm.id) {
        updateProperty(editForm as Property);
        setEditingId(null);
    }
    setEditForm({});
  };

  const handleCancel = () => {
      setEditingId(null);
      setIsAdding(false);
      setEditForm({});
  };

  const startAdd = () => {
      setIsAdding(true);
      setEditingId('new');
      setEditForm({
          type: 'Casa',
          status: 'Em Construção',
          features: [],
          imageUrl: '',
          images: [],
          videos: [],
          floorPlans: [],
          units: []
      });
      setActiveTab('info');
  }

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'plan' | 'unit') => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoadingFile(true);

      try {
          let base64String = "";
          
          if (type === 'video' || file.type.includes('video')) {
              alert("⚠️ Vídeos ocupam muito espaço e não podem ser salvos nesta versão demo.");
              setIsLoadingFile(false);
              e.target.value = ''; 
              return;
          } else {
              base64String = await resizeImage(file);
          }

          if (type === 'image') {
              setEditForm(prev => ({ ...prev, images: [...(prev.images || []), base64String] }));
              if (!editForm.imageUrl || editForm.imageUrl.includes('placeholder')) {
                  setEditForm(prev => ({ ...prev, imageUrl: base64String }));
              }
          } else if (type === 'plan') {
              setEditForm(prev => ({ ...prev, floorPlans: [...(prev.floorPlans || []), base64String] }));
          } else if (type === 'unit') {
              setNewUnit(prev => ({ ...prev, image: base64String }));
          }
      } catch (error) {
          console.error("Error processing file", error);
          alert("Erro ao processar o arquivo.");
      } finally {
          setIsLoadingFile(false);
          e.target.value = ''; 
      }
  };

  const removeMedia = (type: 'image' | 'video' | 'plan', index: number) => {
      if(type === 'image') {
          const newArr = [...(editForm.images || [])];
          newArr.splice(index, 1);
          setEditForm({...editForm, images: newArr});
      }
      if(type === 'plan') {
        const newArr = [...(editForm.floorPlans || [])];
        newArr.splice(index, 1);
        setEditForm({...editForm, floorPlans: newArr});
      }
  };

  const addUnit = () => {
      if (!newUnit.name || !newUnit.price) return;
      const unitToAdd: PropertyUnit = {
          id: Date.now().toString(),
          name: newUnit.name,
          price: newUnit.price,
          bedrooms: newUnit.bedrooms || 1,
          bathrooms: newUnit.bathrooms || 1,
          size: newUnit.size || '',
          image: newUnit.image,
          description: newUnit.description
      };
      setEditForm(prev => ({ ...prev, units: [...(prev.units || []), unitToAdd] }));
      setNewUnit({ bedrooms: 2, bathrooms: 1, name: '', price: 0, size: '', description: '' });
  };

  const removeUnit = (unitId: string) => {
      setEditForm(prev => ({ ...prev, units: prev.units?.filter(u => u.id !== unitId) }));
  };

  const renderEditForm = () => (
    <div className="p-0 flex flex-col h-full bg-white text-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto px-2 pt-2">
            <button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-xs md:text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'info' ? 'bg-white text-emerald-600 border-t border-l border-r border-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}>Informações</button>
            <button onClick={() => setActiveTab('media')} className={`px-4 py-2 text-xs md:text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'media' ? 'bg-white text-emerald-600 border-t border-l border-r border-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}>Mídia & Fotos</button>
            {editForm.type === 'Prédio' && (
                <button onClick={() => setActiveTab('units')} className={`px-4 py-2 text-xs md:text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'units' ? 'bg-white text-emerald-600 border-t border-l border-r border-gray-200' : 'text-gray-500 hover:bg-gray-100'}`}>Tipologias</button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {activeTab === 'info' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-emerald-500"
                                value={editForm.type || 'Casa'}
                                onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                            >
                                <option value="Casa">Casa</option>
                                <option value="Prédio">Prédio</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Status</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-emerald-500"
                                value={editForm.status || 'Na Planta'}
                                onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                            >
                                <option value="Na Planta">Na Planta</option>
                                <option value="Em Construção">Em Construção</option>
                                <option value="Pronto">Pronto</option>
                            </select>
                        </div>
                    </div>
                    
                    <input className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-emerald-500" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nome do Empreendimento" />
                    <input className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Endereço Completo" />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Preço (A partir)</label>
                            <input className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" type="number" value={editForm.price || ''} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} />
                        </div>
                         <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Resumo Specs</label>
                            <input className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" value={editForm.specs || ''} placeholder="Ex: 2 Quartos" onChange={e => setEditForm({...editForm, specs: e.target.value})} />
                        </div>
                    </div>
                    <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none h-24 resize-none" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Descrição comercial..." />
                </div>
            )}

            {activeTab === 'media' && (
                <div className="space-y-6 relative">
                    {isLoadingFile && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                            <span className="text-xs font-bold text-emerald-700">Processando imagem...</span>
                        </div>
                    )}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><ImageIcon size={14}/> Galeria</h4>
                        <button onClick={() => imageInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg p-3 flex items-center justify-center gap-2 transition-all mb-3 text-xs font-bold">
                            <Upload size={16} /> Adicionar Fotos
                        </button>
                        <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                        <div className="grid grid-cols-3 gap-2">
                            {editForm.images?.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200">
                                    <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                                    <button onClick={() => removeMedia('image', idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Layout size={14}/> Plantas Gerais</h4>
                        <button onClick={() => planInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg p-3 flex items-center justify-center gap-2 transition-all mb-3 text-xs font-bold">
                            <Upload size={16} /> Adicionar Planta
                        </button>
                        <input type="file" ref={planInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'plan')} />
                         <div className="grid grid-cols-3 gap-2">
                            {editForm.floorPlans?.map((plan, idx) => (
                                <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200">
                                    <img src={plan} className="w-full h-full object-contain p-1" alt="Planta" />
                                    <button onClick={() => removeMedia('plan', idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'units' && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        {editForm.units?.map((unit) => (
                            <div key={unit.id} className="bg-gray-50 p-3 rounded border border-gray-200 flex gap-3 relative group items-center">
                                <div className="w-12 h-12 bg-white border border-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {unit.image ? <img src={unit.image} alt="Planta" className="w-full h-full object-contain" /> : <Layout size={20} className="text-gray-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-xs text-gray-800 truncate">{unit.name}</h5>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>{unit.bedrooms}d</span>•<span>{unit.size}</span>•<span className="text-emerald-600 font-bold">R${unit.price.toLocaleString('pt-BR',{notation:'compact'})}</span>
                                    </div>
                                </div>
                                <button onClick={() => removeUnit(unit.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <h5 className="font-bold text-xs text-blue-800 mb-2 flex items-center gap-1"><Plus size={12}/> Nova Unidade</h5>
                        <div className="space-y-2">
                            <input className="w-full p-2 text-xs border border-blue-200 rounded bg-white outline-none" placeholder="Nome (ex: Final 1)" value={newUnit.name || ''} onChange={e => setNewUnit({...newUnit, name: e.target.value})} />
                            <div className="flex gap-2">
                                <input className="w-1/2 p-2 text-xs border border-blue-200 rounded bg-white outline-none" placeholder="Preço" type="number" value={newUnit.price || ''} onChange={e => setNewUnit({...newUnit, price: Number(e.target.value)})} />
                                <input className="w-1/2 p-2 text-xs border border-blue-200 rounded bg-white outline-none" placeholder="Tam (m²)" value={newUnit.size || ''} onChange={e => setNewUnit({...newUnit, size: e.target.value})} />
                            </div>
                             <div className="flex gap-2">
                                <input className="w-1/2 p-2 text-xs border border-blue-200 rounded bg-white outline-none" placeholder="Quartos" type="number" value={newUnit.bedrooms || ''} onChange={e => setNewUnit({...newUnit, bedrooms: Number(e.target.value)})} />
                                <input className="w-1/2 p-2 text-xs border border-blue-200 rounded bg-white outline-none" placeholder="Banheiros" type="number" value={newUnit.bathrooms || ''} onChange={e => setNewUnit({...newUnit, bathrooms: Number(e.target.value)})} />
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => unitImageInputRef.current?.click()} className="flex-1 bg-white border border-blue-200 text-blue-600 text-xs py-2 rounded hover:bg-blue-50">{newUnit.image ? 'Planta OK' : 'Upload Planta'}</button>
                                <input type="file" ref={unitImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'unit')} />
                                <button onClick={addUnit} disabled={!newUnit.name || !newUnit.price} className="flex-1 bg-blue-600 text-white text-xs py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50">Adicionar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={handleCancel} className="px-4 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded-lg transition">Cancelar</button>
            <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-sm transition flex items-center gap-2">
                <Save size={16} /> Salvar
            </button>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Imóveis</h2>
            <p className="text-sm text-gray-500">Gerencie o inventário que a IA usará para vendas.</p>
        </div>
        <button 
            onClick={startAdd}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm font-bold w-full md:w-auto justify-center"
        >
            <Plus size={20} />
            Novo Imóvel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Editor Card */}
        {(isAdding || (editingId === 'new')) && (
            <div className="bg-white rounded-xl shadow-xl border-2 border-emerald-500 overflow-hidden flex flex-col h-[600px] md:col-span-1 xl:col-span-1 z-10 relative">
               {renderEditForm()}
            </div>
        )}

        {properties.map(property => (
          <div key={property.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col group transition-all hover:shadow-md h-auto`}>
            {editingId === property.id ? (
                renderEditForm()
            ) : (
                <div className="flex flex-col h-full">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                        <img 
                            src={property.imageUrl} 
                            alt={property.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Sem+Imagem';
                            }}
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-800 shadow-sm uppercase tracking-wider">
                            {property.status}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4">
                             <div className="flex gap-2">
                                {property.videos?.length > 0 && <div className="bg-white/20 backdrop-blur text-white p-1 rounded" title="Vídeo"><Film size={12}/></div>}
                                {property.floorPlans?.length > 0 && <div className="bg-white/20 backdrop-blur text-white p-1 rounded" title="Planta"><Layout size={12}/></div>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 text-base leading-tight line-clamp-1" title={property.name}>{property.name}</h3>
                            <button onClick={() => handleEditClick(property)} className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-full hover:bg-emerald-50 transition-colors">
                                <Edit2 size={16} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
                            <MapPin size={14} className="flex-shrink-0 text-emerald-600" />
                            <span className="truncate">{property.address}</span>
                        </div>

                        <p className="text-gray-600 text-xs mb-4 line-clamp-2 leading-relaxed">{property.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200 font-medium">{property.type}</span>
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200 font-medium truncate max-w-[150px]">{property.specs}</span>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-end justify-between">
                            <div>
                                <span className="text-[10px] text-gray-400 font-medium uppercase block mb-0.5">A partir de</span>
                                <span className="font-bold text-lg text-emerald-700 tracking-tight">
                                    R$ {property.price.toLocaleString('pt-BR', {notation: 'compact'})}
                                </span>
                            </div>
                            <button onClick={() => handleEditClick(property)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Properties;

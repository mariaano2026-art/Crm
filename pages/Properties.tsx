
import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { Property, PropertyUnit } from '../types';
import { Edit2, MapPin, Home, Save, Plus, Image as ImageIcon, Film, Layout, Trash2, Upload, Grid, BedDouble, Bath, Loader2, Download } from 'lucide-react';

const Properties: React.FC = () => {
  const { properties, updateProperty, addProperty } = useCRM();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Property>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'units'>('info');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Refs for hidden file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);
  const unitImageInputRef = useRef<HTMLInputElement>(null);

  // Temp state for adding a new unit
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
            imageUrl: editForm.imageUrl || "https://picsum.photos/800/600",
            images: editForm.images || [],
            videos: editForm.videos || [],
            floorPlans: editForm.floorPlans || [],
            units: editForm.units || [],
            type: editForm.type || 'Casa' // Garantir default
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
          imageUrl: 'https://picsum.photos/800/600?grayscale',
          images: [],
          videos: [],
          floorPlans: [],
          units: []
      });
      setActiveTab('info');
  }

  // Helper to resize and compress images before saving
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // AGGRESSIVE COMPRESSION SETTINGS
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
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
          
          // Compress to JPEG with 0.5 quality (approx 30-50KB per image)
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // File Upload Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'plan' | 'unit') => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsLoadingFile(true);

      try {
          let base64String = "";
          
          // Block Video Uploads to LocalStorage
          if (type === 'video' || file.type.includes('video')) {
              alert("⚠️ Vídeos ocupam muito espaço e não podem ser salvos no navegador nesta versão.\n\nUse apenas imagens compactas.");
              setIsLoadingFile(false);
              e.target.value = ''; // Reset input
              return;
          } else {
              // Compress Images
              base64String = await resizeImage(file);
          }

          if (type === 'image') {
              setEditForm(prev => ({ ...prev, images: [...(prev.images || []), base64String] }));
              // Set as main image if none exists or if it's a placeholder
              if (!editForm.imageUrl || editForm.imageUrl.includes('picsum') || editForm.imageUrl.includes('placeholder')) {
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
          e.target.value = ''; // Reset input
      }
  };

  const removeMedia = (type: 'image' | 'video' | 'plan', index: number) => {
      if(type === 'image') {
          const newArr = [...(editForm.images || [])];
          newArr.splice(index, 1);
          setEditForm({...editForm, images: newArr});
      }
      if(type === 'video') {
        const newArr = [...(editForm.videos || [])];
        newArr.splice(index, 1);
        setEditForm({...editForm, videos: newArr});
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
    <div className="p-4 flex flex-col gap-3 h-full bg-white text-gray-800">
        <div className="flex border-b border-gray-200 mb-2 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'info' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
            >
                Informações
            </button>
            <button 
                onClick={() => setActiveTab('media')}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'media' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
            >
                Mídia & Arquivos
            </button>
            {editForm.type === 'Prédio' && (
                <button 
                    onClick={() => setActiveTab('units')}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeTab === 'units' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                >
                    Tipologias / Plantas
                </button>
            )}
        </div>

        {activeTab === 'info' && (
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    {isAdding ? 'Novo Imóvel' : `Editando: ${editForm.name}`}
                </div>
                
                {/* TIPO E STATUS NA PRIMEIRA LINHA PARA DESTAQUE */}
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-1/2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Tipo de Imóvel</label>
                        <select 
                            className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                            value={editForm.type || 'Casa'}
                            onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                        >
                            <option value="Casa">🏠 Casa / Sobrado</option>
                            <option value="Prédio">🏢 Prédio / Apartamento</option>
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Status da Obra</label>
                        <select 
                            className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={editForm.status || 'Na Planta'}
                            onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                        >
                            <option value="Na Planta">🌱 Na Planta</option>
                            <option value="Em Construção">🏗️ Em Construção</option>
                            <option value="Pronto">🔑 Pronto para Morar</option>
                        </select>
                    </div>
                </div>
                
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Nome do Empreendimento</label>
                    <input 
                        className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                        value={editForm.name || ''}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Ex: Residencial Flores"
                    />
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Endereço Completo</label>
                    <input 
                        className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                        value={editForm.address || ''}
                        onChange={e => setEditForm({...editForm, address: e.target.value})}
                        placeholder="Rua, Número, Bairro..."
                    />
                </div>

                <div className="flex gap-3">
                    <div className="w-1/2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Preço (A partir de)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                            <input 
                                className="w-full border border-gray-300 bg-white text-gray-900 pl-8 pr-2 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                                type="number"
                                value={editForm.price || ''}
                                onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                     <div className="w-1/2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Resumo (Specs)</label>
                        <input 
                            className="w-full border border-gray-300 bg-white text-gray-900 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={editForm.specs || ''}
                            placeholder="Ex: 2 e 3 Quartos, Lazer..."
                            onChange={e => setEditForm({...editForm, specs: e.target.value})}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Descrição Detalhada</label>
                    <textarea 
                        className="w-full border border-gray-300 bg-white text-gray-900 p-3 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] resize-none" 
                        value={editForm.description || ''}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Descreva os diferenciais do imóvel..."
                    />
                </div>
            </div>
        )}

        {activeTab === 'media' && (
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 relative">
                {isLoadingFile && (
                    <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center flex-col rounded-lg">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                        <span className="text-xs font-bold text-emerald-700">Compactando e processando arquivo...</span>
                        <span className="text-[10px] text-gray-500 mt-1">Isso garante que seus dados sejam salvos.</span>
                    </div>
                )}

                {/* PHOTOS MANAGER */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                        <ImageIcon size={14} className="text-emerald-600"/> Galeria de Fotos (Áreas Comuns)
                    </h4>
                    
                    <input 
                        type="file" 
                        ref={imageInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'image')} 
                    />
                    
                    <button 
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg p-3 flex items-center justify-center gap-2 transition-all mb-3 text-xs font-medium"
                    >
                        <Upload size={16} /> Upload Fotos
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                        {editForm.images?.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200">
                                <img src={img} className="w-full h-full object-cover" alt="Thumb" />
                                <button onClick={() => removeMedia('image', idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FLOOR PLANS MANAGER (General) */}
                <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                        <Layout size={14} className="text-emerald-600"/> Planta Geral (Implantação)
                    </h4>
                    
                    <input 
                        type="file" 
                        ref={planInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'plan')} 
                    />

                    <button 
                        onClick={() => planInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg p-3 flex items-center justify-center gap-2 transition-all mb-3 text-xs font-medium"
                    >
                        <Upload size={16} /> Upload Implantação
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                        {editForm.floorPlans?.map((plan, idx) => (
                            <div key={idx} className="relative group aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200">
                                <img src={plan} className="w-full h-full object-contain p-1" alt="Planta" />
                                <button onClick={() => removeMedia('plan', idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'units' && (
            <div className="flex flex-col h-full overflow-hidden relative">
                 {isLoadingFile && (
                    <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center flex-col rounded-lg">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
                        <span className="text-xs font-bold text-emerald-700">Compactando imagem...</span>
                    </div>
                )}
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-3 text-xs text-emerald-800">
                    Cadastre aqui as diferentes plantas deste prédio. A IA usará essas informações para diferenciar preços e quartos.
                </div>

                {/* List of Existing Units */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-3">
                    {editForm.units?.map((unit) => (
                        <div key={unit.id} className="bg-gray-50 p-3 rounded border border-gray-200 flex gap-3 relative group">
                            <div className="w-16 h-16 bg-white border border-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {unit.image ? (
                                    <img src={unit.image} alt="Planta" className="w-full h-full object-contain" />
                                ) : (
                                    <Layout size={24} className="text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h5 className="font-bold text-sm text-gray-800">{unit.name}</h5>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                    <span className="flex items-center gap-1"><BedDouble size={12}/> {unit.bedrooms}</span>
                                    <span className="flex items-center gap-1"><Bath size={12}/> {unit.bathrooms}</span>
                                    <span className="flex items-center gap-1"><Grid size={12}/> {unit.size}</span>
                                </div>
                                <p className="font-bold text-emerald-600 text-sm mt-1">R$ {unit.price.toLocaleString('pt-BR')}</p>
                            </div>
                            <button 
                                onClick={() => removeUnit(unit.id)}
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {(!editForm.units || editForm.units.length === 0) && (
                        <div className="text-center py-8 text-gray-400 italic text-xs">Nenhuma unidade cadastrada ainda.</div>
                    )}
                </div>

                {/* Add New Unit Form */}
                <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                    <h5 className="font-bold text-xs text-gray-600 mb-2 flex items-center gap-1"><Plus size={12}/> Adicionar Nova Tipologia</h5>
                    <div className="space-y-2">
                        <input 
                            className="w-full p-1.5 text-xs border rounded bg-white"
                            placeholder="Nome (ex: Final 1, Garden...)"
                            value={newUnit.name || ''}
                            onChange={e => setNewUnit({...newUnit, name: e.target.value})}
                        />
                        <div className="flex gap-2">
                            <input 
                                className="w-1/2 p-1.5 text-xs border rounded bg-white"
                                placeholder="Preço (R$)"
                                type="number"
                                value={newUnit.price || ''}
                                onChange={e => setNewUnit({...newUnit, price: Number(e.target.value)})}
                            />
                             <input 
                                className="w-1/2 p-1.5 text-xs border rounded bg-white"
                                placeholder="Tamanho (ex: 85m²)"
                                value={newUnit.size || ''}
                                onChange={e => setNewUnit({...newUnit, size: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-2">
                             <div className="w-1/2 flex items-center gap-1 bg-white border rounded px-2">
                                <span className="text-xs text-gray-500">Quartos:</span>
                                <input 
                                    className="flex-1 p-1.5 text-xs outline-none bg-white"
                                    type="number"
                                    value={newUnit.bedrooms || ''}
                                    onChange={e => setNewUnit({...newUnit, bedrooms: Number(e.target.value)})}
                                />
                             </div>
                             <div className="w-1/2 flex items-center gap-1 bg-white border rounded px-2">
                                <span className="text-xs text-gray-500">Banheiros:</span>
                                <input 
                                    className="flex-1 p-1.5 text-xs outline-none bg-white"
                                    type="number"
                                    value={newUnit.bathrooms || ''}
                                    onChange={e => setNewUnit({...newUnit, bathrooms: Number(e.target.value)})}
                                />
                             </div>
                        </div>
                        <textarea 
                             className="w-full p-1.5 text-xs border rounded bg-white"
                             placeholder="Descrição curta..."
                             rows={2}
                             value={newUnit.description || ''}
                             onChange={e => setNewUnit({...newUnit, description: e.target.value})}
                        />
                        
                        {/* Unit Image Upload */}
                        <div className="flex gap-2 items-center">
                            <input 
                                type="file" 
                                ref={unitImageInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleFileUpload(e, 'unit')} 
                            />
                            <button 
                                onClick={() => unitImageInputRef.current?.click()}
                                className="flex-1 border border-dashed border-gray-300 bg-white text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-xs py-2 rounded flex items-center justify-center gap-1"
                            >
                                {isLoadingFile ? <div className="w-3 h-3 border-2 border-emerald-500 rounded-full animate-spin"/> : <Upload size={12} />}
                                {newUnit.image ? 'Trocar Planta' : 'Upload Planta'}
                            </button>
                            {newUnit.image && <div className="text-xs text-green-600 font-bold">Imagem OK</div>}
                        </div>

                        <button 
                            onClick={addUnit}
                            disabled={!newUnit.name || !newUnit.price}
                            className="w-full bg-gray-800 text-white py-2 rounded text-xs font-bold hover:bg-gray-900 disabled:opacity-50"
                        >
                            Adicionar Tipologia
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-end gap-2 mt-auto border-t border-gray-200 pt-3">
            <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm font-medium">Cancelar</button>
            <button onClick={handleSave} className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-sm font-medium shadow-sm"><Save size={16}/> Salvar</button>
        </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Imóveis & Empreendimentos</h2>
        
        <div className="flex gap-2">
            <button 
                onClick={startAdd}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm ml-2"
            >
                <Plus size={20} />
                Novo Imóvel
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Inline Edit / Add Card */}
        {(isAdding || (editingId === 'new')) && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-500 overflow-hidden flex flex-col h-[580px]">
               {renderEditForm()}
            </div>
        )}

        {properties.map(property => (
          <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group h-[580px]">
            {editingId === property.id ? (
                renderEditForm()
            ) : (
                <>
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                        <img 
                            src={property.imageUrl} 
                            alt={property.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
                            {property.status}
                        </div>
                        {/* Media Indicators */}
                        <div className="absolute bottom-2 left-2 flex gap-1">
                            {property.videos && property.videos.length > 0 && <div className="bg-black/50 text-white p-1 rounded" title="Possui Vídeo"><Film size={12}/></div>}
                            {property.floorPlans && property.floorPlans.length > 0 && <div className="bg-black/50 text-white p-1 rounded" title="Possui Planta"><Layout size={12}/></div>}
                            {property.units && property.units.length > 0 && <div className="bg-emerald-500 text-white p-1 rounded flex items-center gap-1 text-[10px] font-bold px-2" title="Tipologias"><Grid size={10}/> {property.units.length} Tipos</div>}
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 text-lg leading-tight">{property.name}</h3>
                            <button onClick={() => handleEditClick(property)} className="text-gray-400 hover:text-emerald-600 p-1 rounded-full hover:bg-gray-50 transition">
                                <Edit2 size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                            <MapPin size={16} />
                            <span className="truncate">{property.address}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{property.description}</p>
                        
                        {/* Mini list of units if available */}
                        {property.units && property.units.length > 0 && (
                            <div className="mb-3 bg-gray-50 p-2 rounded border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Opções Disponíveis:</p>
                                <div className="space-y-1">
                                    {property.units.slice(0, 2).map(u => (
                                        <div key={u.id} className="flex justify-between text-xs text-gray-600">
                                            <span>{u.bedrooms} Dorms ({u.size})</span>
                                            <span className="font-bold text-emerald-600">R$ {u.price.toLocaleString('pt-BR', { notation: 'compact' })}</span>
                                        </div>
                                    ))}
                                    {property.units.length > 2 && <p className="text-[10px] text-center text-gray-400">+ {property.units.length - 2} opções</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                            {property.features.slice(0, 3).map((feat, idx) => (
                                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                    {feat}
                                </span>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                            <div>
                                <span className="text-xs text-gray-400 block">A partir de</span>
                                <span className="font-bold text-xl text-emerald-700">
                                    R$ {property.price.toLocaleString('pt-BR')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                <Home size={16} />
                                {property.type}
                            </div>
                        </div>
                    </div>
                </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Properties;
import React, { useState, useRef } from 'react';
import { useComanda } from '../../context/ComandaContext';
import { formatBRL } from '../../utils/formatters';
import {
  Store,
  Phone,
  MessageSquare,
  Instagram,
  MapPin,
  DollarSign,
  Bike,
  Clock,
  QrCode,
  Volume2,
  Check,
  Upload,
  Image as ImageIcon,
  Save,
  Power,
  Sparkles,
  Percent,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, toggleStoreStatus, clearAllOrders, resetSystemToZero } = useComanda();

  // Local Form State initialized from config
  const [formData, setFormData] = useState({
    name: config.name || '',
    tagline: config.tagline || '',
    phone: config.phone || '',
    whatsapp: config.whatsapp || '',
    instagram: config.instagram || '',
    address: config.address || '',
    logoUrl: config.logoUrl || '',
    bannerUrl: config.bannerUrl || '',
    isOpen: config.isOpen !== false,
    serviceFeePercent: config.serviceFeePercent ?? 10,
    deliveryFee: config.deliveryFee ?? 6.0,
    freeDeliveryThreshold: config.freeDeliveryThreshold ?? 70.0,
    defaultDriverPayoutFee: config.defaultDriverPayoutFee ?? 5.0,
    estimatedDeliveryMinutes: config.estimatedDeliveryMinutes ?? 35,
    minOrderDelivery: config.minOrderDelivery ?? 20.0,
    pixKey: config.pixKey || '',
    enableSoundAlerts: config.enableSoundAlerts !== false,
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!file) return;
    setUploadError(null);

    const isLogo = type === 'logo';
    if (isLogo) setIsUploadingLogo(true);
    else setIsUploadingBanner(true);

    try {
      const data = new FormData();
      data.append('photo', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Falha no upload da imagem');
      }

      const result = await response.json();
      if (result.url) {
        if (isLogo) {
          handleInputChange('logoUrl', result.url);
        } else {
          handleInputChange('bannerUrl', result.url);
        }
      }
    } catch (err: any) {
      console.error('Erro no upload de imagem:', err);
      setUploadError('Não foi possível salvar a imagem. Tente novamente ou use uma URL externa.');
    } finally {
      if (isLogo) setIsUploadingLogo(false);
      else setIsUploadingBanner(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      name: formData.name.trim() || 'Meu Restaurante',
      tagline: formData.tagline.trim(),
      phone: formData.phone.trim(),
      whatsapp: formData.whatsapp.trim(),
      instagram: formData.instagram.trim(),
      address: formData.address.trim(),
      logoUrl: formData.logoUrl.trim(),
      bannerUrl: formData.bannerUrl.trim(),
      isOpen: formData.isOpen,
      serviceFeePercent: Number(formData.serviceFeePercent) || 0,
      deliveryFee: Number(formData.deliveryFee) || 0,
      freeDeliveryThreshold: Number(formData.freeDeliveryThreshold) || 0,
      defaultDriverPayoutFee: Number(formData.defaultDriverPayoutFee) || 0,
      estimatedDeliveryMinutes: Number(formData.estimatedDeliveryMinutes) || 30,
      minOrderDelivery: Number(formData.minOrderDelivery) || 0,
      pixKey: formData.pixKey.trim(),
      enableSoundAlerts: formData.enableSoundAlerts,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const formatCleanWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Configurações do Estabelecimento</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                Banco JSON
              </span>
            </h1>
            <p className="text-xs text-stone-400">
              Personalize nome, contatos, redes sociais, taxas, fotos e status do restaurante
            </p>
          </div>
        </div>

        {/* Store Status Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const newStatus = !formData.isOpen;
              handleInputChange('isOpen', newStatus);
              updateConfig({ isOpen: newStatus });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              formData.isOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            <Power className={`w-4 h-4 ${formData.isOpen ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span>{formData.isOpen ? 'Loja Aberta (Online)' : 'Loja Fechada (Offline)'}</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 text-xs font-bold animate-fade-in shadow-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identidade & Fotos */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-800 font-bold text-sm">
            <Store className="w-4 h-4 text-amber-500" />
            <span>Identidade Visual & Marca</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Ex: Quintal & Sabor Gourmet"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Slogan / Subtítulo
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => handleInputChange('tagline', e.target.value)}
                placeholder="Ex: Hambúrgueres Artesanais, Porções & Chope"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Envio de logo e banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Logo / Foto Principal */}
            <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50 flex flex-col items-center justify-center text-center space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Foto / Logo do Estabelecimento
              </label>

              {formData.logoUrl ? (
                <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-white shadow-sm">
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('logoUrl', '')}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Remover foto"
                  >
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl border border-stone-300 bg-stone-100 flex items-center justify-center text-stone-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}

              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0], 'logo');
                  }
                }}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingLogo ? 'Enviando...' : 'Upload Imagem'}</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Ou cole o endereço de uma imagem da internet..."
                value={formData.logoUrl}
                onChange={e => handleInputChange('logoUrl', e.target.value)}
                className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Banner de Capa */}
            <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-stone-50/50 flex flex-col items-center justify-center text-center space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                Banner / Capa do Cardápio
              </label>

              {formData.bannerUrl ? (
                <div className="relative group w-full h-24 rounded-2xl overflow-hidden border border-stone-300 bg-white shadow-sm">
                  <img
                    src={formData.bannerUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('bannerUrl', '')}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Remover banner"
                  >
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-24 rounded-2xl border border-stone-300 bg-stone-100 flex items-center justify-center text-stone-400">
                  <span className="text-xs text-stone-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    Sem banner configurado
                  </span>
                </div>
              )}

              <input
                type="file"
                ref={bannerInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0], 'banner');
                  }
                }}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingBanner ? 'Enviando...' : 'Upload Banner'}</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Ou cole o endereço de uma imagem da internet..."
                value={formData.bannerUrl}
                onChange={e => handleInputChange('bannerUrl', e.target.value)}
                className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contatos & Redes Sociais */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-800 font-bold text-sm">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Contatos & Redes Sociais</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                Telefone Fixo / Central
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="(11) 3456-7890"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp
                </span>
                {formData.whatsapp && (
                  <a
                    href={`https://wa.me/55${formatCleanWhatsApp(formData.whatsapp)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-normal"
                  >
                    Testar <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => handleInputChange('whatsapp', e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  Instagram
                </span>
                {formData.instagram && (
                  <a
                    href={`https://instagram.com/${formData.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-pink-600 hover:underline flex items-center gap-0.5 font-normal"
                  >
                    Ver <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={e => handleInputChange('instagram', e.target.value)}
                placeholder="@quintalesabor"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Endereço Completo do Estabelecimento
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => handleInputChange('address', e.target.value)}
              placeholder="Ex: Rua Gastronômica, 420 - Jardins, São Paulo - SP"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Section 3: Regras Financeiras, Delivery & Taxas */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 text-stone-800 font-bold text-sm">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Taxas, Delivery & Pagamentos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-purple-600" />
                Taxa de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={formData.deliveryFee}
                onChange={e => handleInputChange('deliveryFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Entrega Grátis a partir de (R$)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.freeDeliveryThreshold}
                onChange={e => handleInputChange('freeDeliveryThreshold', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-600" />
                Taxa de Serviço Garçom (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="30"
                value={formData.serviceFeePercent}
                onChange={e => handleInputChange('serviceFeePercent', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-blue-600" />
                Repasse Motoboy por Corrida (R$)
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={formData.defaultDriverPayoutFee}
                onChange={e => handleInputChange('defaultDriverPayoutFee', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                Tempo Médio de Entrega (min)
              </label>
              <input
                type="number"
                step="5"
                min="10"
                value={formData.estimatedDeliveryMinutes}
                onChange={e => handleInputChange('estimatedDeliveryMinutes', parseInt(e.target.value, 10) || 30)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-stone-500" />
                Pedido Mínimo Delivery (R$)
              </label>
              <input
                type="number"
                step="5"
                min="0"
                value={formData.minOrderDelivery}
                onChange={e => handleInputChange('minOrderDelivery', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-stone-500" />
                Chave PIX do Estabelecimento
              </label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={e => handleInputChange('pixKey', e.target.value)}
                placeholder="CNPJ, E-mail ou Celular"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* System Reset & Zero State Zone */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-rose-900">
            <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-rose-950">Zona de Limpeza & Começar do Zero</h3>
              <p className="text-xs text-rose-700">Remova pedidos em andamento, limpe o KDS ou zere os dados para iniciar seus próprios registros.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Confirma a exclusão de TODOS os pedidos em preparo/recebidos e liberação de todas as mesas?')) {
                  clearAllOrders();
                  alert('Todos os pedidos foram removidos e as mesas foram liberadas com sucesso!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Limpar Todos os Pedidos & KDS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('ATENÇÃO: Deseja ZERAR TUDO (pedidos, mesas, motoboys e cardápio) para começar 100% do zero com base limpa?')) {
                  resetSystemToZero(true);
                  alert('Sistema completamente zerado! Você pode cadastrar seus pratos e configurações do zero.');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Zerar Sistema Completo (Base 100% Limpa)</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 sticky bottom-4 z-20">
          <button
            type="submit"
            id="btn-save-store-settings"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm shadow-lg transition-all cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Settings,
  Store,
  FileCode2
} from 'lucide-react';
import { ConfiguracionPulperia } from '../../types';
import { db } from '../../services/db';
import { audioSpeech } from '../../services/audioSpeech';

interface BackupModalProps {
  config: ConfiguracionPulperia;
  onClose: () => void;
  onRefresh: () => void;
  audioEnabled: boolean;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  config,
  onClose,
  onRefresh,
  audioEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'config'>('backup');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Formulario de Configuración
  const [configForm, setConfigForm] = useState<ConfiguracionPulperia>({ ...config });

  // Descargar Respaldo JSON / SQLite
  const handleExport = () => {
    const jsonStr = db.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulperia_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (audioEnabled) audioSpeech.playSuccessSound();
  };

  // Importar Respaldo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.importDatabaseJSON(content);
      if (success) {
        setImportStatus('✅ Base de datos restaurada correctamente.');
        if (audioEnabled) audioSpeech.playSuccessSound();
        onRefresh();
      } else {
        setImportStatus('❌ Error al procesar el archivo de respaldo.');
      }
    };
    reader.readAsText(file);
  };

  // Restaurar datos de fábrica / Demo
  const handleResetDefaults = () => {
    if (confirm('¿Estás seguro de restablecer la base de datos a los valores de demostración iniciales?')) {
      db.resetToDefaults();
      if (audioEnabled) audioSpeech.playSuccessSound();
      onRefresh();
      onClose();
    }
  };

  // Guardar configuración
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateConfig(configForm);
    if (audioEnabled) audioSpeech.playSuccessSound();
    onRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Gestión de Base de Datos & Configuración
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'backup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Respaldo SQLite / JSON
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'config' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Datos de la Pulpería
          </button>
        </div>

        {/* CONTENIDO TAB 1: BACKUP & SQLITE */}
        {activeTab === 'backup' && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-emerald-600" />
                <span>Base de Datos Local Offline (SQLite Schema Ready)</span>
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Toda la información de productos, clientes, ventas, abonos y movimientos de caja se almacena de forma local e instantánea sin depender de internet.
              </p>
            </div>

            {/* Exportar */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Exportar copia de seguridad:</label>
              <button
                onClick={handleExport}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descargar Respaldo JSON / SQLite</span>
              </button>
            </div>

            {/* Importar */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Restaurar desde archivo:</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-300"
                />
              </div>
              {importStatus && (
                <p className="text-xs font-semibold text-emerald-700 mt-1">{importStatus}</p>
              )}
            </div>

            {/* Reset Defaults */}
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={handleResetDefaults}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restablecer Datos de Demostración</span>
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO TAB 2: CONFIGURACIÓN DE LA TIENDA */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nombre del Negocio:</label>
              <input
                type="text"
                required
                value={configForm.nombre_negocio}
                onChange={(e) => setConfigForm({ ...configForm, nombre_negocio: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Propietario / Dueño:</label>
                <input
                  type="text"
                  value={configForm.propietario}
                  onChange={(e) => setConfigForm({ ...configForm, propietario: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Símbolo Moneda:</label>
                <input
                  type="text"
                  required
                  placeholder="L, $, Q, C$, ₡"
                  value={configForm.moneda_simbolo}
                  onChange={(e) => setConfigForm({ ...configForm, moneda_simbolo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Teléfono de Contacto:</label>
              <input
                type="text"
                value={configForm.telefono}
                onChange={(e) => setConfigForm({ ...configForm, telefono: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dirección Física:</label>
              <input
                type="text"
                value={configForm.direccion}
                onChange={(e) => setConfigForm({ ...configForm, direccion: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Fondo de Efectivo Inicial ({configForm.moneda_simbolo}):</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0.00"
                value={configForm.efectivo_inicial === 0 ? '' : configForm.efectivo_inicial}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfigForm({ 
                    ...configForm, 
                    efectivo_inicial: val === '' ? 0 : parseFloat(val) || 0 
                  });
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mensaje al Pie del Ticket:</label>
              <input
                type="text"
                value={configForm.mensaje_ticket}
                onChange={(e) => setConfigForm({ ...configForm, mensaje_ticket: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>GUARDAR CONFIGURACIÓN</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

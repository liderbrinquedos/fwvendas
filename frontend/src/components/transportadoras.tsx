'use client';

import { useState, useEffect } from 'react';
import { fmt, whatsappLink } from '@/lib/utils';
import { erpApi } from '@/lib/erp-api';
import type { Transportadora } from '@/lib/data-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Truck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Building2,
  MessageCircle,
} from 'lucide-react';

/* ---------- status badge ---------- */
function carrierStatus(t: Transportadora) {
  if (!t.ativo)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-500/14 text-gray-400">
        Inativo
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/14 text-emerald-400">
      Ativo
    </span>
  );
}

/* ---------- empty carrier ---------- */
const emptyTransportadora: Transportadora = {
  id: 0,
  razaoSocial: '',
  nome: '',
  cnpj: '',
  ie: '',
  tipoFrete: '',
  regioes: '',
  cep: '',
  telefone: '',
  email: '',
  perfil: '',
  ativo: true,
};

/* ================================================================== */
export default function TransportadorasPage() {
  /* state */
  const [search, setSearch] = useState('');
  const [detailTransportadora, setDetailTransportadora] = useState<Transportadora | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transportadora>(emptyTransportadora);
  const [deleteTarget, setDeleteTarget] = useState<Transportadora | null>(null);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
   const [loading, setLoading] = useState(true);
   useEffect(() => {
     erpApi.getTransportadoras()
       .then(res => {
         console.log('Transportadoras API response:', res);
         setTransportadoras(res.data);
         setLoading(false);
       })
       .catch(err => {
         console.error('Erro ao carregar transportadoras:', err);
         setLoading(false);
       });
   }, []);

  /* filtered list */
  const filtered = transportadoras.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.nome.toLowerCase().includes(q) ||
      t.cnpj.includes(q) ||
      t.regioes.toLowerCase().includes(q)
    );
  });

   /* handlers */
  function openNew() {
    setEditing({ ...emptyTransportadora, id: Date.now() });
    setFormOpen(true);
  }

  function openEdit(t: Transportadora) {
    setEditing({ ...t });
    setFormOpen(true);
  }

  function openDetail(t: Transportadora) {
    setDetailTransportadora(t);
  }

  async function saveForm() {
    try {
      const isNew = !transportadoras.find(x => x.id === editing.id);
      if (isNew) {
        const res = await erpApi.createTransportadora({
          id: editing.id,
          nome: editing.nome,
          cnpj: editing.cnpj,
          tipoFrete: editing.tipoFrete,
          regioes: editing.regioes,
          prazo: editing.prazo,
          ativo: editing.ativo,
        });
        setTransportadoras([...transportadoras, res.data]);
      } else {
        const res = await erpApi.updateTransportadora(editing.id, {
          nome: editing.nome,
          cnpj: editing.cnpj,
          tipoFrete: editing.tipoFrete,
          regioes: editing.regioes,
          prazo: editing.prazo,
          ativo: editing.ativo,
        });
        setTransportadoras(transportadoras.map(x => x.id === editing.id ? res.data : x));
      }
      setFormOpen(false);
      setEditing(emptyTransportadora);
    } catch (err) {
      console.error('Erro ao salvar transportadora:', err);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await erpApi.deleteTransportadora(deleteTarget.id);
      setTransportadoras(transportadoras.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Erro ao excluir transportadora:', err);
    }
  }

   /* ---- input class ---- */
  const ic =
    'bg-[#0C0E14] border border-[#252836] rounded-lg text-white text-sm px-3 py-2 focus:border-amber-500 outline-none w-full';

  /* section label */
  const sectionLabel = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider">
        {text}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ---- header row ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-amber-500" />
          Transportadoras
          <span className="text-sm font-normal text-zinc-400">
            ({transportadoras.length})
          </span>
        </h2>

        <div className="flex-1" />

        {/* search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className={ic + ' pl-9'}
            placeholder="Buscar nome / CNPJ / I.E.…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* new button */}
        <button
          onClick={openNew}
          className="bg-amber-500 text-[#0C0E14] hover:bg-amber-600 font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Transportadora
        </button>
      </div>

      {/* ---- table ---- */}
      <div className="bg-[#151820] border border-[#252836] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252836] text-zinc-400 text-left text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">I.E.</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Tipo Frete</th>
                <th className="px-4 py-3">Regiões</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[#252836]/50 hover:bg-[#1a1d28] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{t.nome}</div>
                    {t.razaoSocial && (
                      <div className="text-zinc-500 text-xs">{t.razaoSocial}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300 text-xs">
                    {t.cnpj}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300 text-xs">
                    {t.ie}
                  </td>
                  <td className="px-4 py-3">
                    {t.telefone && whatsappLink(t.telefone) ? (
                      <a
                        href={whatsappLink(t.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{t.telefone}</span>
                      </a>
                    ) : (
                      <span className="text-zinc-500 text-xs">{t.telefone}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">
                    {t.tipoFrete}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">
                    {t.regioes}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">
                    {t.prazo}
                  </td>
                  <td className="px-4 py-3">{carrierStatus(t)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openDetail(t)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-amber-500 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-amber-500 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                    Nenhuma transportadora encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== DETAIL MODAL ========== */}
      <Dialog
        open={!!detailTransportadora}
        onOpenChange={(o) => !o && setDetailTransportadora(null)}
      >
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {detailTransportadora && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  {detailTransportadora.nome}
                </DialogTitle>
                {detailTransportadora.razaoSocial && (
                  <DialogDescription className="text-zinc-400 text-sm">
                    {detailTransportadora.razaoSocial}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* Identificação */}
              <div className="border-t border-[#252836] pt-3">
                {sectionLabel(
                  <Building2 className="w-4 h-4 text-amber-500" />,
                  'Identificação'
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">CNPJ</span>
                    <p className="text-white font-mono text-xs">{detailTransportadora.cnpj}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">I.E.</span>
                    <p className="text-white font-mono text-xs">{detailTransportadora.ie}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 text-xs">Status</span>
                    <div className="mt-0.5">{carrierStatus(detailTransportadora)}</div>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="border-t border-[#252836] pt-3">
                {sectionLabel(
                  <Phone className="w-4 h-4 text-amber-500" />,
                  'Contato'
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">Telefone</span>
                    <p className="flex items-center gap-1.5">
                      {detailTransportadora.telefone && whatsappLink(detailTransportadora.telefone) ? (
                        <a
                          href={whatsappLink(detailTransportadora.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {detailTransportadora.telefone}
                        </a>
                      ) : (
                        <span className="text-white">{detailTransportadora.telefone}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Email</span>
                    <p className="text-white text-xs">{detailTransportadora.email}</p>
                  </div>
                </div>
              </div>

              {/* Frete */}
              <div className="border-t border-[#252836] pt-3">
                {sectionLabel(
                  <CreditCard className="w-4 h-4 text-amber-500" />,
                  'Frete'
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">Tipo Frete</span>
                    <p className="text-white">{detailTransportadora.tipoFrete}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Regiões</span>
                    <p className="text-white">{detailTransportadora.regioes}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== FORM MODAL ========== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              {transportadoras.find((x) => x.id === editing.id)
                ? 'Editar Transportadora'
                : 'Nova Transportadora'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Identificação */}
            <div>
              {sectionLabel(
                <Building2 className="w-4 h-4 text-amber-500" />,
                'Identificação'
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">Nome</label>
                  <input
                    className={ic}
                    value={editing.nome}
                    onChange={(e) =>
                      setEditing({ ...editing, nome: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">CNPJ</label>
                    <input
                      className={ic}
                      value={editing.cnpj}
                      onChange={(e) =>
                        setEditing({ ...editing, cnpj: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">I.E.</label>
                    <input
                      className={ic}
                      value={editing.ie}
                      onChange={(e) =>
                        setEditing({ ...editing, ie: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="border-t border-[#252836] pt-4">
              {sectionLabel(
                <Phone className="w-4 h-4 text-amber-500" />,
                'Contato'
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">
                    Telefone
                  </label>
                  <input
                    className={ic}
                    value={editing.telefone}
                    onChange={(e) =>
                      setEditing({ ...editing, telefone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">
                    Email
                  </label>
                  <input
                    className={ic}
                    value={editing.email}
                    onChange={(e) =>
                      setEditing({ ...editing, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Frete */}
            <div className="border-t border-[#252836] pt-4">
              {sectionLabel(
                <CreditCard className="w-4 h-4 text-amber-500" />,
                'Frete'
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">
                    Tipo Frete
                  </label>
                  <input
                    className={ic}
                    value={editing.tipoFrete}
                    onChange={(e) =>
                      setEditing({ ...editing, tipoFrete: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1 block">
                    Regiões
                  </label>
                  <input
                    className={ic}
                    value={editing.regioes}
                    onChange={(e) =>
                      setEditing({ ...editing, regioes: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Ativo */}
            <div className="border-t border-[#252836] pt-4">
              <div className="flex items-center gap-3">
                <label className="text-zinc-400 text-sm">Ativo</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editing.ativo}
                  onClick={() =>
                    setEditing({ ...editing, ativo: !editing.ativo })
                  }
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    editing.ativo ? 'bg-amber-500' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editing.ativo ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setFormOpen(false)}
              className="border border-[#252836] text-white hover:border-amber-500 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={saveForm}
              className="bg-amber-500 text-[#0C0E14] hover:bg-amber-600 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DELETE MODAL ========== */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg text-red-400">
              Excluir Transportadora
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Tem certeza que deseja excluir{' '}
              <span className="text-white font-medium">
                {deleteTarget?.nome}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDeleteTarget(null)}
              className="border border-[#252836] text-white hover:border-amber-500 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="bg-red-500/14 text-red-400 hover:bg-red-500/24 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

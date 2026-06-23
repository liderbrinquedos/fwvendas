'use client';

import { useState, useEffect } from 'react';
import { fmt, whatsappLink } from '@/lib/utils';
import { erpApi } from '@/lib/erp-api';
import { useEmpresa } from '@/contexts/empresa-context';
import type { Cliente } from '@/lib/types';
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
  Users,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Building2,
} from 'lucide-react';

/* ---------- status badge ---------- */
function clientStatus(c: Cliente) {
  if (!c.ativo)
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

/* ---------- unique UFs ---------- */

/* ---------- empty client ---------- */
const emptyCliente: Cliente = {
  id: 0,
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  ie: '',
  suframa: '',
  email: '',
  emailNfe: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  limiteCredito: 0,
  ativo: true,
};

/* ================================================================== */
export default function ClientesPage() {
  /* state */
  const [search, setSearch] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [detailClient, setDetailClient] = useState<Cliente | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente>(emptyCliente);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { vendedor } = useEmpresa();
  useEffect(() => {
    erpApi.getClientes(vendedor?.id, vendedor?.tipo).then(res => {
      setClientes(res.data);
      setLoading(false);
    });
  }, [vendedor?.id, vendedor?.tipo]);
  const ufs = Array.from(new Set(clientes.map((c) => c.uf).filter(Boolean))).sort();

  /* filtered list */
  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.nomeFantasia.toLowerCase().includes(q) ||
      c.razaoSocial.toLowerCase().includes(q) ||
      c.cnpj.includes(q) ||
      c.ie.includes(q);
    const matchUf = !ufFilter || c.uf === ufFilter;
    return matchSearch && matchUf;
  });

  /* paginação local */
  const PAGE_SIZE = 16;
  const hasFilter = !!search.trim() || !!ufFilter;
  const displayed = hasFilter || showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  /* handlers */
  function openNew() {
    setEditing({ ...emptyCliente, id: Date.now() });
    setFormOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditing({ ...c });
    setFormOpen(true);
  }

  async function saveForm() {
    try {
      const isNew = !clientes.find(x => x.id === editing.id);
      if (isNew) {
        const res = await erpApi.createCliente({
          id: editing.id,
          razao_social: editing.razaoSocial,
          nome_fantasia: editing.nomeFantasia,
          cnpj: editing.cnpj,
          ie: editing.ie,
          email: editing.email,
          telefone: editing.telefone,
          cep: editing.cep,
          logradouro: editing.logradouro,
          numero: editing.numero,
          bairro: editing.bairro,
          cidade: editing.cidade,
          uf: editing.uf,
          limite_credito: editing.limiteCredito,
          ativo: editing.ativo,
        });
        setClientes([...clientes, res.data]);
      } else {
        const res = await erpApi.updateCliente(editing.id, {
          razao_social: editing.razaoSocial,
          nome_fantasia: editing.nomeFantasia,
          cnpj: editing.cnpj,
          ie: editing.ie,
          email: editing.email,
          telefone: editing.telefone,
          cep: editing.cep,
          logradouro: editing.logradouro,
          numero: editing.numero,
          bairro: editing.bairro,
          cidade: editing.cidade,
          uf: editing.uf,
          limite_credito: editing.limiteCredito,
          ativo: editing.ativo,
        });
        setClientes(clientes.map(x => x.id === editing.id ? res.data : x));
      }
      setFormOpen(false);
      setEditing(emptyCliente);
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await erpApi.deleteCliente(deleteTarget.id);
      setClientes(clientes.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
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
          <Users className="w-5 h-5 text-amber-500" />
          Clientes
          <span className="text-sm font-normal text-zinc-400">
            ({displayed.length}{displayed.length < clientes.length ? ` de ${clientes.length}` : ''})
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

        {/* UF filter */}
        <select
          className={ic + ' w-full sm:w-28'}
          value={ufFilter}
          onChange={(e) => setUfFilter(e.target.value)}
        >
          <option value="">Todos UF</option>
          {ufs.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        {/* new button */}
        <button
          onClick={openNew}
          className="bg-amber-500 text-[#0C0E14] hover:bg-amber-600 font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* ---- table ---- */}
      <div className="bg-[#151820] border border-[#252836] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252836] text-zinc-400 text-left text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Fantasia</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">I.E.</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Email NF-e</th>
                <th className="px-4 py-3 text-right">Crédito</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#252836]/50 hover:bg-[#1a1d28] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{c.nomeFantasia}</div>
                    <div className="text-zinc-500 text-xs">{c.razaoSocial}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300 text-xs">
                    {c.cnpj}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300 text-xs">
                    {c.ie}
                  </td>
                  <td className="px-4 py-3">
                    {c.telefone && whatsappLink(c.telefone) ? (
                      <a
                        href={whatsappLink(c.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{c.telefone}</span>
                      </a>
                    ) : (
                      <span className="text-zinc-500 text-xs">{c.telefone}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs">
                    {c.cidade}/{c.uf}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.emailNfe}</td>
                  <td className="px-4 py-3 text-right text-white">
                    {fmt(c.limiteCredito)}
                  </td>
                  <td className="px-4 py-3">{clientStatus(c)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setDetailClient(c)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-amber-500 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-amber-500 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
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
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- toggle mostra mais ---- */}
      {!loading && !hasFilter && filtered.length > PAGE_SIZE && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="border border-[#252836] text-zinc-400 hover:text-white hover:border-amber-500 text-xs px-4 py-2 rounded-lg transition-colors"
          >
            {showAll ? 'Mostrar menos' : `Mostrar todos (${filtered.length})`}
          </button>
        </div>
      )}

      {/* ========== DETAIL MODAL ========== */}
      <Dialog
        open={!!detailClient}
        onOpenChange={(o) => !o && setDetailClient(null)}
      >
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          {detailClient && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  {detailClient.nomeFantasia}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm">
                  {detailClient.razaoSocial}
                </DialogDescription>
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
                    <p className="text-white font-mono text-xs">{detailClient.cnpj}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">I.E.</span>
                    <p className="text-white font-mono text-xs">{detailClient.ie}</p>
                  </div>
                  {detailClient.suframa && (
                    <div>
                      <span className="text-zinc-500 text-xs">SUFRAMA</span>
                      <p className="text-white font-mono text-xs">
                        {detailClient.suframa}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-500 text-xs">Status</span>
                    <div className="mt-0.5">{clientStatus(detailClient)}</div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="border-t border-[#252836] pt-3">
                {sectionLabel(
                  <MapPin className="w-4 h-4 text-amber-500" />,
                  'Endereço'
                )}
                <div className="text-sm space-y-1">
                  <p className="text-white">
                    {detailClient.logradouro}, {detailClient.numero}
                    {detailClient.complemento
                      ? ` - ${detailClient.complemento}`
                      : ''}
                  </p>
                  <p className="text-zinc-300">
                    {detailClient.bairro} - {detailClient.cidade}/{detailClient.uf}
                  </p>
                  <p className="text-zinc-400 text-xs">CEP: {detailClient.cep}</p>
                </div>
              </div>

              {/* Contato e NF-e */}
              <div className="border-t border-[#252836] pt-3">
                {sectionLabel(
                  <Phone className="w-4 h-4 text-amber-500" />,
                  'Contato e NF-e'
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">Telefone</span>
                    <p className="flex items-center gap-1.5">
                      {detailClient.telefone && whatsappLink(detailClient.telefone) ? (
                        <a
                          href={whatsappLink(detailClient.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {detailClient.telefone}
                        </a>
                      ) : (
                        <span className="text-white">{detailClient.telefone}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Email</span>
                    <p className="text-white text-xs">{detailClient.email}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Email NF-e</span>
                    <p className="text-white text-xs">{detailClient.emailNfe}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Limite de Crédito</span>
                    <p className="text-amber-400 font-semibold">
                      {fmt(detailClient.limiteCredito)}
                    </p>
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
              <Pencil className="w-5 h-5 text-amber-500" />
              {clientes.find((x) => x.id === editing.id)
                ? 'Editar Cliente'
                : 'Novo Cliente'}
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
                  <label className="text-zinc-400 text-xs mb-1 block">Razão Social</label>
                  <input
                    className={ic}
                    value={editing.razaoSocial}
                    onChange={(e) =>
                      setEditing({ ...editing, razaoSocial: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Nome Fantasia</label>
                    <input
                      className={ic}
                      value={editing.nomeFantasia}
                      onChange={(e) =>
                        setEditing({ ...editing, nomeFantasia: e.target.value })
                      }
                    />
                  </div>
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
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">SUFRAMA</label>
                    <input
                      className={ic}
                      value={editing.suframa}
                      onChange={(e) =>
                        setEditing({ ...editing, suframa: e.target.value })
                      }
                    />
                  </div>
                </div>
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

            {/* Endereço */}
            <div className="border-t border-[#252836] pt-4">
              {sectionLabel(
                <MapPin className="w-4 h-4 text-amber-500" />,
                'Endereço'
              )}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-zinc-400 text-xs mb-1 block">
                      Logradouro
                    </label>
                    <input
                      className={ic}
                      value={editing.logradouro}
                      onChange={(e) =>
                        setEditing({ ...editing, logradouro: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Número</label>
                    <input
                      className={ic}
                      value={editing.numero}
                      onChange={(e) =>
                        setEditing({ ...editing, numero: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">
                      Complemento
                    </label>
                    <input
                      className={ic}
                      value={editing.complemento}
                      onChange={(e) =>
                        setEditing({ ...editing, complemento: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Bairro</label>
                    <input
                      className={ic}
                      value={editing.bairro}
                      onChange={(e) =>
                        setEditing({ ...editing, bairro: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">CEP</label>
                    <input
                      className={ic}
                      value={editing.cep}
                      onChange={(e) =>
                        setEditing({ ...editing, cep: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Cidade</label>
                    <input
                      className={ic}
                      value={editing.cidade}
                      onChange={(e) =>
                        setEditing({ ...editing, cidade: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">UF</label>
                    <input
                      className={ic}
                      value={editing.uf}
                      onChange={(e) =>
                        setEditing({ ...editing, uf: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="border-t border-[#252836] pt-4">
              {sectionLabel(
                <Mail className="w-4 h-4 text-amber-500" />,
                'Contato e NF-e'
              )}
              <div className="space-y-3">
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
                      Limite de Crédito
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={ic}
                      value={editing.limiteCredito || ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          limiteCredito: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Email</label>
                    <input
                      className={ic}
                      value={editing.email}
                      onChange={(e) =>
                        setEditing({ ...editing, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">
                      Email NF-e
                    </label>
                    <input
                      className={ic}
                      value={editing.emailNfe}
                      onChange={(e) =>
                        setEditing({ ...editing, emailNfe: e.target.value })
                      }
                    />
                  </div>
                </div>
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
              Excluir Cliente
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Tem certeza que deseja excluir{' '}
              <span className="text-white font-medium">
                {deleteTarget?.nomeFantasia}
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

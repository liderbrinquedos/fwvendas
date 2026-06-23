'use client';

import { useState, useEffect } from 'react';
import { fmt, fmtN } from '@/lib/utils';
import { erpApi } from '@/lib/erp-api';
import type { Produto } from '@/lib/data-types';
import { useCartStore } from '@/store/cart-store';
import { useEmpresa } from '@/contexts/empresa-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Package,
  ChevronDown,
  Ruler,
  ShoppingCart,
  Weight,
  Layers,
  Box,
  Columns3,
} from 'lucide-react';

/* ---------- status badge ---------- */
function stockStatus(p: { ativo: boolean; estoque: number; estoqueMin: number }) {
  if (!p.ativo)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gray-500/14 text-gray-400">
        Inativo
      </span>
    );
  if (p.estoque <= p.estoqueMin * 0.5)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-red-500/14 text-red-400">
        Crítico
      </span>
    );
  if (p.estoque <= p.estoqueMin)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-yellow-500/14 text-yellow-400">
        Baixo
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/14 text-emerald-400">
      Normal
    </span>
  );
}

/* ---------- unique categories ---------- */

/* ---------- empty product ---------- */
const emptyProduto: Produto = {
  id: 0,
  codigo: '',
  nome: '',
  categoria: '',
  unidade: 'Unidade',
  precoBase: 0,
  estoque: 0,
  estoqueMin: 0,
  ativo: true,
  peso: 0,
  altura: 0,
  largura: 0,
  comprimento: 0,
  metroCubico: 0,
  qtdCaixa: 1,
  multiploVenda: 1,
};

/* ================================================================== */
export default function ProdutosPage() {
  /* state */
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [detailProd, setDetailProd] = useState<Produto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Produto>(emptyProduto);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);
  const [addCartTarget, setAddCartTarget] = useState<Produto | null>(null);
  const [addCartQty, setAddCartQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem)
  const { empresa } = useEmpresa();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!empresa) {
      setLoading(false);
      return;
    }
    erpApi.getEmpresaProdutos(empresa.id).then(res => {
      setProdutos(res.data);
      setLoading(false);
    });
  }, [empresa]);
  const categories = Array.from(new Set(produtos.map((p) => p.categoria).filter(Boolean))).sort();

  /* filtered list */
  const filtered = produtos.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q && !catFilter) return true;
    const matchRef = p.referencia && p.referencia.trim().toLowerCase() === q;
    const matchNome = p.nome.toLowerCase().includes(q);
    const matchSearch = !q || matchRef || matchNome;
    const matchCat = !catFilter || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  /* column picker */
  const colDefs = [
    { key: 'ref', label: 'Referência', align: 'left' as const, tdClass: 'font-mono text-zinc-300 text-xs', render: (p: Produto) => p.referencia || p.codigo || '' },
    { key: 'nome', label: 'Produto', align: 'left' as const, tdClass: '', render: (p: Produto) => (
      <div><div className="text-white font-medium">{p.nome}</div><div className="text-zinc-500 text-xs">{p.categoria}</div></div>
    )},
    { key: 'preco', label: 'Preço', align: 'right' as const, tdClass: 'text-white', render: (p: Produto) => fmt(p.precoBase) },
    { key: 'estoque', label: 'Estoque', align: 'right' as const, tdClass: 'text-zinc-300', render: (p: Produto) => fmtN(p.estoque) },
    { key: 'm3', label: 'M Cubico', align: 'right' as const, tdClass: 'text-zinc-300', render: (p: Produto) => `${p.metroCubico.toFixed(4)} m³` },
    { key: 'qtdCx', label: 'Qtd/Cx', align: 'right' as const, tdClass: 'text-zinc-300', render: (p: Produto) => p.qtdCaixa },
    { key: 'multiplo', label: 'Múltiplo', align: 'right' as const, tdClass: '', render: (p: Produto) => (
      <span className={`font-medium ${p.multiploVenda > 1 ? 'text-amber-400' : 'text-zinc-500'}`}>{p.multiploVenda}</span>
    )},
    { key: 'status', label: 'Status', align: 'left' as const, tdClass: '', render: (p: Produto) => stockStatus(p) },
  ];
  const allKeys = colDefs.map(c => c.key);
  const [visibleCols, setVisibleCols] = useState<string[]>(allKeys);

  /* handlers */
  function openNew() {
    setEditing({ ...emptyProduto, id: Date.now(), multiploVenda: 1 });
    setFormOpen(true);
  }

  function openEdit(p: Produto) {
    setEditing({ ...p });
    setFormOpen(true);
  }

  async function saveForm() {
    try {
      const isNew = !produtos.find(x => x.id === editing.id);
      if (isNew) {
        const res = await erpApi.createProduto({
          id: editing.id,
          codigo: editing.codigo,
          nome: editing.nome,
          unidade: editing.unidade,
          ativo: editing.ativo,
          categoria: editing.categoria,
          ean: editing.ean,
          ncm: editing.ncm,
          estoque: editing.estoque,
          peso: editing.peso,
          altura: editing.altura,
          largura: editing.largura,
          comprimento: editing.comprimento,
          factory_id: editing.factoryId,
          factory_name: editing.factoryName,
        });
        setProdutos([...produtos, res.data]);
      } else {
        const res = await erpApi.updateProduto(editing.id, {
          codigo: editing.codigo,
          nome: editing.nome,
          unidade: editing.unidade,
          ativo: editing.ativo,
          categoria: editing.categoria,
          ean: editing.ean,
          ncm: editing.ncm,
          estoque: editing.estoque,
          peso: editing.peso,
          altura: editing.altura,
          largura: editing.largura,
          comprimento: editing.comprimento,
          factory_id: editing.factoryId,
          factory_name: editing.factoryName,
        });
        setProdutos(produtos.map(x => x.id === editing.id ? res.data : x));
      }
      setFormOpen(false);
      setEditing(emptyProduto);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await erpApi.deleteProduto(deleteTarget.id);
      setProdutos(produtos.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
    }
  }

  /* auto-calc m³ */
  function handleDimension(field: 'altura' | 'largura' | 'comprimento', val: number) {
    const next = { ...editing, [field]: val };
    next.metroCubico = (next.altura * next.largura * next.comprimento) / 1_000_000;
    setEditing(next);
  }

  /* Add to Cart */
  function openAddCart(p: Produto) {
    const multiplo = p.multiploVenda > 0 ? p.multiploVenda : p.qtdCaixa || 1
    setAddCartQty(multiplo)
    setAddCartTarget(p)
  }

  function confirmAddCart() {
    if (!addCartTarget) return
    const multiplo = addCartTarget.multiploVenda > 0 ? addCartTarget.multiploVenda : addCartTarget.qtdCaixa || 1
    addItem({
      id: `cart-${addCartTarget.id}-${Date.now()}`,
      productId: addCartTarget.id,
      productName: addCartTarget.nome,
      productSku: addCartTarget.codigo,
      category: addCartTarget.categoria,
      factoryId: addCartTarget.factoryId || `factory-${addCartTarget.categoria.toLowerCase()}`,
      factoryName: addCartTarget.factoryName || addCartTarget.categoria,
      quantity: addCartQty,
      unitPrice: addCartTarget.precoBase,
      qtdCaixa: addCartTarget.qtdCaixa,
      multiploVenda: multiplo,
      peso: addCartTarget.peso,
      metroCubico: addCartTarget.metroCubico,
    })
    setAddCartTarget(null)
    setAddCartQty(1)
  }

  /* ---- input class ---- */
  const ic =
    'bg-[#0C0E14] border border-[#252836] rounded-lg text-white text-sm px-3 py-2 focus:border-amber-500 outline-none w-full';

  return (
    <div className="space-y-4">
      {/* ---- header row ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          Produtos
          <span className="text-sm font-normal text-zinc-400">
            ({produtos.length})
          </span>
        </h2>

        <div className="flex-1" />

        {/* search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className={ic + ' pl-9'}
            placeholder="Buscar nome / referência…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* category filter */}
        <select
          className={ic + ' w-full sm:w-44'}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* new button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="border border-[#252836] text-zinc-400 hover:text-white hover:border-amber-500 transition-colors p-2 rounded-lg"
              title="Colunas visíveis"
            >
              <Columns3 className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#151820] border-[#252836] text-white min-w-36">
            {colDefs.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleCols.includes(col.key)}
                onCheckedChange={() => setVisibleCols(prev => prev.includes(col.key) ? prev.filter(k => k !== col.key) : [...prev, col.key])}
                className="text-zinc-300 text-xs"
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={openNew}
          className="bg-amber-500 text-[#0C0E14] hover:bg-amber-600 font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* ---- table ---- */}
      <div className="bg-[#151820] border border-[#252836] rounded-xl overflow-hidden">
        {empresa && (
          <div className="px-4 py-2 bg-amber-500/8 border-b border-[#252836] text-xs text-amber-300 flex items-center gap-2">
            <span className="font-semibold">Empresa:</span> {empresa.razaoSocial}
            <span className="text-zinc-500 mx-1">|</span>
            <span className="text-zinc-400">{produtos.length} produtos disponíveis</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#252836] text-zinc-400 text-left text-xs uppercase tracking-wider">
                {colDefs.filter(c => visibleCols.includes(c.key)).map(col => (
                  <th key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#252836]/50 hover:bg-[#1a1d28] transition-colors"
                >
                  {colDefs.filter(c => visibleCols.includes(c.key)).map(col => (
                    <td key={col.key} className={`px-4 py-3 ${col.tdClass} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                      {col.render(p)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setDetailProd(p)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-amber-500 transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openAddCart(p)}
                        className="p-1.5 rounded-md hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 transition-colors"
                        title="Adicionar ao Carrinho"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-md hover:bg-[#252836] text-zinc-400 hover:text-amber-500 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
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
                  <td colSpan={visibleCols.length + 1} className="px-4 py-8 text-center text-zinc-500">
                    Carregando...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== DETAIL MODAL ========== */}
      <Dialog open={!!detailProd} onOpenChange={(o) => !o && setDetailProd(null)}>
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-lg">
          {detailProd && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  {detailProd.nome}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-sm">
                  {detailProd.codigo} &middot; {detailProd.categoria}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs">Unidade</span>
                  <p className="text-white">{detailProd.unidade}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Preço Base</span>
                  <p className="text-white">{fmt(detailProd.precoBase)}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Estoque</span>
                  <p className="text-white">{fmtN(detailProd.estoque)}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Estoque Mínimo</span>
                  <p className="text-white">{fmtN(detailProd.estoqueMin)}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Peso</span>
                  <p className="text-white">
                    {detailProd.peso >= 1000 ? `${(detailProd.peso / 1000).toFixed(1)} t` : `${detailProd.peso} kg`}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Status</span>
                  <div className="mt-0.5">{stockStatus(detailProd)}</div>
                </div>
              </div>

              {/* packaging section */}
              <div className="border-t border-[#252836] pt-3 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider">
                    Embalagem e Venda
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">Qtd/Caixa</span>
                    <p className="text-white">{detailProd.qtdCaixa}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Múltiplo de Venda</span>
                    <p className={`font-medium ${detailProd.multiploVenda > 1 ? 'text-amber-400' : 'text-white'}`}>
                      {detailProd.multiploVenda}
                    </p>
                  </div>
                </div>
              </div>

              {/* dimensions section */}
              <div className="border-t border-[#252836] pt-3 mt-1">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider">
                    Dimensões
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500 text-xs">Altura (mm)</span>
                    <p className="text-white">{fmtN(detailProd.altura)}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Largura (mm)</span>
                    <p className="text-white">{fmtN(detailProd.largura)}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs">Comprimento (mm)</span>
                    <p className="text-white">{fmtN(detailProd.comprimento)}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-zinc-500 text-xs">m³</span>
                  <p className="text-amber-400 font-semibold">
                    {detailProd.metroCubico.toFixed(6)}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== ADD TO CART MODAL ========== */}
      <Dialog open={!!addCartTarget} onOpenChange={(o) => !o && setAddCartTarget(null)}>
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-sm">
          {addCartTarget && (() => {
            const multiplo = addCartTarget.multiploVenda > 0 ? addCartTarget.multiploVenda : addCartTarget.qtdCaixa || 1
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-500" />
                    Adicionar ao Carrinho
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 text-sm">
                    {addCartTarget.nome} &middot; {fmt(addCartTarget.precoBase)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  {/* Multiplo info */}
                  {multiplo > 1 && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <Layers className="size-3.5" />
                        Múltiplo de Venda: {multiplo}
                      </div>
                      <p className="text-amber-400/80">
                        A quantidade deve ser múltipla de {multiplo} ({multiplo}, {multiplo * 2}, {multiplo * 3}…)
                      </p>
                    </div>
                  )}

                  {/* Quantity input */}
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Quantidade</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newQty = Math.max(multiplo, addCartQty - multiplo)
                          setAddCartQty(newQty)
                        }}
                        className="size-9 rounded-lg border border-[#252836] flex items-center justify-center text-zinc-400 hover:text-white hover:border-amber-500 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className={ic + ' text-center flex-1'}
                        value={addCartQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          setAddCartQty(val)
                        }}
                        min={multiplo}
                        step={multiplo}
                      />
                      <button
                        onClick={() => setAddCartQty(addCartQty + multiplo)}
                        className="size-9 rounded-lg border border-[#252836] flex items-center justify-center text-zinc-400 hover:text-white hover:border-amber-500 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {addCartQty > 0 && addCartQty % multiplo !== 0 && (
                      <p className="text-red-400 text-xs mt-1">
                        Quantidade inválida. Será arredondada para {Math.ceil(addCartQty / multiplo) * multiplo}
                      </p>
                    )}
                  </div>

                  {/* Weight info */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0C0E14] border border-[#252836] text-xs">
                    <Weight className="size-3.5 text-zinc-500" />
                    <span className="text-zinc-400">Peso total:</span>
                    <span className="text-white font-medium">
                      {(addCartQty * addCartTarget.peso).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
                    </span>
                  </div>

                  {/* Cubage info */}
                  {addCartTarget.metroCubico > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0C0E14] border border-[#252836] text-xs">
                      <Box className="size-3.5 text-zinc-500" />
                      <span className="text-zinc-400">Cubagem total:</span>
                      <span className="text-white font-medium">
                        {(addCartQty * addCartTarget.metroCubico).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} m³
                      </span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0C0E14] border border-[#252836]">
                    <span className="text-zinc-400 text-xs">Subtotal</span>
                    <span className="text-amber-400 font-bold">
                      {fmt(addCartQty * addCartTarget.precoBase)}
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  <button
                    onClick={() => setAddCartTarget(null)}
                    className="border border-[#252836] text-white hover:border-amber-500 text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmAddCart}
                    className="bg-amber-500 text-[#0C0E14] hover:bg-amber-600 font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Adicionar
                  </button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ========== FORM MODAL ========== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-[#151820] border-[#252836] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              {produtos.find((x) => x.id === editing.id)
                ? 'Editar Produto'
                : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Código</label>
                <input
                  className={ic}
                  value={editing.codigo}
                  onChange={(e) =>
                    setEditing({ ...editing, codigo: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Categoria</label>
                <input
                  className={ic}
                  value={editing.categoria}
                  onChange={(e) =>
                    setEditing({ ...editing, categoria: e.target.value })
                  }
                />
              </div>
            </div>

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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Unidade</label>
                <input
                  className={ic}
                  value={editing.unidade}
                  onChange={(e) =>
                    setEditing({ ...editing, unidade: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Preço Base</label>
                <input
                  type="number"
                  step="0.01"
                  className={ic}
                  value={editing.precoBase || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      precoBase: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className={ic}
                  value={editing.peso || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      peso: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Estoque</label>
                <input
                  type="number"
                  className={ic}
                  value={editing.estoque || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      estoque: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs mb-1 block">Estoque Mínimo</label>
                <input
                  type="number"
                  className={ic}
                  value={editing.estoqueMin || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      estoqueMin: parseInt(e.target.value) || 0,
                    })
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
                onClick={() => setEditing({ ...editing, ativo: !editing.ativo })}
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

            {/* collapsible packaging & dimensions */}
            <details className="group border border-[#252836] rounded-lg">
              <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer text-amber-500 text-xs font-semibold uppercase tracking-wider select-none hover:bg-[#1a1d28] rounded-lg transition-colors">
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                Embalagem, Múltiplo e Dimensões
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Qtd/Caixa (Embalagem)</label>
                    <input
                      type="number"
                      className={ic}
                      value={editing.qtdCaixa || ''}
                      onChange={(e) => {
                        const qtd = parseInt(e.target.value) || 1
                        setEditing({
                          ...editing,
                          qtdCaixa: qtd,
                          // Auto-set multiploVenda to match qtdCaixa if it was the same
                          multiploVenda: editing.multiploVenda === editing.qtdCaixa ? qtd : editing.multiploVenda,
                        })
                      }}
                    />
                    <p className="text-zinc-600 text-[10px] mt-0.5">Qtd. padrão da caixa fechada</p>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">Múltiplo de Venda</label>
                    <input
                      type="number"
                      className={ic}
                      value={editing.multiploVenda || ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          multiploVenda: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-zinc-600 text-[10px] mt-0.5">Incremento no carrinho</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">
                      Altura (mm)
                    </label>
                    <input
                      type="number"
                      className={ic}
                      value={editing.altura || ''}
                      onChange={(e) =>
                        handleDimension(
                          'altura',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">
                      Largura (mm)
                    </label>
                    <input
                      type="number"
                      className={ic}
                      value={editing.largura || ''}
                      onChange={(e) =>
                        handleDimension(
                          'largura',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">
                      Comprimento (mm)
                    </label>
                    <input
                      type="number"
                      className={ic}
                      value={editing.comprimento || ''}
                      onChange={(e) =>
                        handleDimension(
                          'comprimento',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 text-xs">m³ (auto-calculado)</span>
                  <p className="text-amber-400 font-semibold text-sm">
                    {editing.metroCubico.toFixed(6)}
                  </p>
                </div>
              </div>
            </details>
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
              Excluir Produto
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

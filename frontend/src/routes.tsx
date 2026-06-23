import { Routes, Route } from 'react-router-dom'
import Dashboard from './components/dashboard'
import Pedidos from './components/pedidos'
import Produtos from './components/produtos'
import Clientes from './components/clientes'
import Transportadoras from './components/transportadoras'
import Regras from './components/regras'
import ERP from './components/erp'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/pedidos" element={<Pedidos onOpenCart={() => {}} />} />
      <Route path="/produtos" element={<Produtos />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/transportadoras" element={<Transportadoras />} />
      <Route path="/regras" element={<Regras />} />
      <Route path="/erp" element={<ERP />} />
    </Routes>
  )
}

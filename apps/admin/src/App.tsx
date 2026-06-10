import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Fabrics from './pages/Fabrics';
import Categories from './pages/Categories';
import type { Page } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const content = {
    dashboard: <Dashboard />,
    products: <Products />,
    fabrics: <Fabrics />,
    categories: <Categories />,
  }[page];

  return (
    <Layout current={page} onNavigate={setPage}>
      {content}
    </Layout>
  );
}

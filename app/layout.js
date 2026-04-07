import './globals.css';

export const metadata = {
  title: 'Monitor de Obras — Sistema de Gestão',
  description: 'Sistema completo para gerenciamento de obras, fornecedores, materiais e despesas.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

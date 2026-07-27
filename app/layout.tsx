import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monitor de Obras — Sistema de Gestão',
  description: 'Sistema completo para gerenciamento de obras, fornecedores, materiais e despesas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

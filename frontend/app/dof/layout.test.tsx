import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import DofLayout from '@/app/dof/layout';

// Настоящий Navbar тянет авторизацию и роутер — здесь важен только набор ссылок
vi.mock('@/components/navbar/Navbar', () => ({
    default: ({ title, linkOptions }: { title: string; linkOptions: { label: string; href: string }[] }) => (
        <nav aria-label={title}>
            {linkOptions.map((link) => (
                <a key={link.href} href={link.href}>
                    {link.label}
                </a>
            ))}
        </nav>
    ),
}));

it('меню декана ведёт на все его страницы', () => {
    render(<DofLayout>содержимое</DofLayout>);

    const links = screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]);
    expect(links).toEqual([
        ['Статистика', '/dof/statistics'],
        ['Составление графика', '/dof/schedule'],
        ['Рассмотрение документов', '/dof/documents'],
    ]);
    expect(screen.getByText('содержимое')).toBeInTheDocument();
});

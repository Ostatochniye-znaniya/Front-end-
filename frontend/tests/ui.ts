import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

function dropdown(label: string): HTMLElement {
    return screen.getByText(label, { selector: '.dropdown-label' }).parentElement!;
}

export async function openDropdown(user: UserEvent, label: string): Promise<string[]> {
    const container = dropdown(label);
    await user.click(container.querySelector('.dropdown-header')!);
    return within(container).getAllByRole('listitem').map((item) => item.textContent ?? '');
}

export async function selectOption(user: UserEvent, label: string, option: string) {
    await openDropdown(user, label);
    await user.click(within(dropdown(label)).getByText(option, { selector: '.dropdown-item' }));
}

/** Строка таблицы по тексту одной из её ячеек. */
export function rowOf(cellText: string): HTMLElement {
    return screen.getByRole('cell', { name: cellText }).closest('tr')!;
}

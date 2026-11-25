import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SegmentedToggle from '@/components/toggle/SegmentedToggle';

const OPTIONS = [
    { value: 'reports', label: 'Отчёты' },
    { value: 'schedules', label: 'Графики' },
];

// jsdom не считает раскладку, поэтому размеры кнопок задаём сами
let widths: Record<string, number>;

beforeEach(() => {
    widths = { Отчёты: 100, Графики: 140 };
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
        this: HTMLElement
    ) {
        return widths[this.textContent ?? ''] ?? 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
        this: HTMLElement
    ) {
        return this.textContent === 'Графики' ? widths['Отчёты'] : 0;
    });
});

const thumb = (container: HTMLElement) =>
    container.querySelector<HTMLElement>('.segmented-toggle-thumb');

describe('SegmentedToggle', () => {
    it('отмечает выбранный сегмент', () => {
        render(<SegmentedToggle options={OPTIONS} value="schedules" onChange={() => {}} />);

        expect(screen.getByRole('tab', { name: 'Графики' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: 'Отчёты' })).toHaveAttribute('aria-selected', 'false');
    });

    it('сообщает значение нажатого сегмента', async () => {
        const onChange = vi.fn();
        render(<SegmentedToggle options={OPTIONS} value="reports" onChange={onChange} />);

        await userEvent.click(screen.getByRole('tab', { name: 'Графики' }));

        expect(onChange).toHaveBeenCalledExactlyOnceWith('schedules');
    });

    it('двигает обводку к выбранному сегменту', () => {
        const { container, rerender } = render(
            <SegmentedToggle options={OPTIONS} value="reports" onChange={() => {}} />
        );
        expect(thumb(container)).toHaveStyle({ left: '0px', width: '100px' });

        rerender(<SegmentedToggle options={OPTIONS} value="schedules" onChange={() => {}} />);
        expect(thumb(container)).toHaveStyle({ left: '100px', width: '140px' });
    });

    it('пересчитывает обводку при изменении размера и отписывается при размонтировании', () => {
        let resize = () => {};
        const disconnect = vi.fn();
        vi.stubGlobal(
            'ResizeObserver',
            class {
                constructor(callback: () => void) {
                    resize = callback;
                }
                observe() {}
                disconnect = disconnect;
            }
        );
        const { container, unmount } = render(
            <SegmentedToggle options={OPTIONS} value="reports" onChange={() => {}} />
        );

        widths['Отчёты'] = 60;
        act(() => resize());
        expect(thumb(container)).toHaveStyle({ width: '60px' });

        unmount();
        expect(disconnect).toHaveBeenCalled();
    });

    it('при неизвестном значении ничего не отмечает выбранным', () => {
        render(<SegmentedToggle options={OPTIONS} value="нет такого" onChange={() => {}} />);

        for (const tab of screen.getAllByRole('tab')) {
            expect(tab).toHaveAttribute('aria-selected', 'false');
        }
    });

    it('не рисует обводку без вариантов', () => {
        const { container } = render(<SegmentedToggle options={[]} value="" onChange={() => {}} />);

        expect(thumb(container)).toBeNull();
    });

    it('растягивается по fullWidth', () => {
        render(<SegmentedToggle options={OPTIONS} value="reports" onChange={() => {}} fullWidth />);

        expect(screen.getByRole('tablist')).toHaveClass('segmented-toggle-full');
    });
});

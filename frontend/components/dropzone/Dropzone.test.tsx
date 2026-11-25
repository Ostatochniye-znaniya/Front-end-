import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Dropzone from '@/components/dropzone/Dropzone';
import { makePdf } from '@/tests/dofFixtures';

function setup(props: Partial<React.ComponentProps<typeof Dropzone>> = {}) {
    const onFile = vi.fn();
    const { container } = render(
        <Dropzone title="Перетащите файл" accept=".pdf" onFile={onFile} {...props} />
    );
    return {
        onFile,
        zone: screen.getByRole('button'),
        input: container.querySelector<HTMLInputElement>('input[type="file"]')!,
    };
}

const drop = (zone: HTMLElement, ...files: File[]) =>
    fireEvent.drop(zone, { dataTransfer: { files } });

describe('Dropzone', () => {
    it('показывает подпись и подсказку, передаёт accept в поле выбора', () => {
        const { input } = setup({ hint: 'PDF до 20 МБ' });

        expect(screen.getByText('Перетащите файл')).toBeInTheDocument();
        expect(screen.getByText('PDF до 20 МБ')).toBeInTheDocument();
        expect(input).toHaveAttribute('accept', '.pdf');
    });

    it('отдаёт брошенный файл', () => {
        const { zone, onFile } = setup();
        const file = makePdf();

        drop(zone, file);

        expect(onFile).toHaveBeenCalledExactlyOnceWith(file);
    });

    it('из нескольких файлов берёт первый', () => {
        const { zone, onFile } = setup();
        const first = makePdf('1.pdf');

        drop(zone, first, makePdf('2.pdf'));

        expect(onFile).toHaveBeenCalledExactlyOnceWith(first);
    });

    it('не реагирует на drop без файлов', () => {
        const { zone, onFile } = setup();

        drop(zone);

        expect(onFile).not.toHaveBeenCalled();
    });

    it.each(['dragOver', 'drop'] as const)(
        'отменяет %s, чтобы браузер не открыл файл вместо страницы',
        (type) => {
            const { zone } = setup({ disabled: true });
            const event = createEvent[type](zone, { dataTransfer: { files: [] } });

            fireEvent(zone, event);

            expect(event.defaultPrevented).toBe(true);
        }
    );

    it('держит подсветку при переходе на вложенный элемент и снимает при уходе', () => {
        const { zone } = setup();

        fireEvent.dragEnter(zone);
        fireEvent.dragEnter(screen.getByText('Перетащите файл'));
        fireEvent.dragLeave(zone);
        expect(zone).toHaveClass('dropzone-active');

        fireEvent.dragLeave(zone);
        expect(zone).not.toHaveClass('dropzone-active');
    });

    it('снимает подсветку после drop', () => {
        const { zone } = setup();

        fireEvent.dragEnter(zone);
        drop(zone, makePdf());

        expect(zone).not.toHaveClass('dropzone-active');
    });

    it('отдаёт файл, выбранный через диалог, и даёт выбрать его повторно', async () => {
        const user = userEvent.setup();
        const { input, onFile } = setup();
        const file = makePdf();

        await user.upload(input, file);
        expect(input.value).toBe('');
        await user.upload(input, file);

        expect(onFile).toHaveBeenCalledTimes(2);
    });

    it('открывает диалог по клику', async () => {
        const { zone, input } = setup();
        const open = vi.spyOn(input, 'click').mockImplementation(() => {});

        await userEvent.click(zone);

        expect(open).toHaveBeenCalledTimes(1);
    });

    it.each(['{Enter}', ' '])('открывает диалог с клавиатуры: "%s"', async (key) => {
        const { input } = setup();
        const open = vi.spyOn(input, 'click').mockImplementation(() => {});

        await userEvent.tab();
        await userEvent.keyboard(key);

        expect(open).toHaveBeenCalledTimes(1);
    });

    it('не открывает диалог по другим клавишам', async () => {
        const { input } = setup();
        const open = vi.spyOn(input, 'click').mockImplementation(() => {});

        await userEvent.tab();
        await userEvent.keyboard('a');

        expect(open).not.toHaveBeenCalled();
    });

    it('отключённая зона не принимает файл, не открывает диалог и не подсвечивается', async () => {
        const { zone, input, onFile } = setup({ disabled: true });
        const open = vi.spyOn(input, 'click').mockImplementation(() => {});

        fireEvent.dragEnter(zone);
        expect(zone).not.toHaveClass('dropzone-active');
        drop(zone, makePdf());
        await userEvent.click(zone);

        expect(onFile).not.toHaveBeenCalled();
        expect(open).not.toHaveBeenCalled();
        expect(zone).toHaveAttribute('aria-disabled', 'true');
        expect(zone).toHaveAttribute('tabindex', '-1');
    });
});

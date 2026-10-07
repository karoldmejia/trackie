const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

export const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// 05 OCT 2025
export const formatShortDate = (dateString: string): string => {
    const d = parseLocalDate(dateString);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = MESES[d.getMonth()];
    return `${dia} ${mes} ${d.getFullYear()}`;
};

// 05 OCT - 11 OCT 2025 (o con años si cambian)
export const formatShortWeekRange = (start: string, end: string): string => {
    const s = parseLocalDate(start);
    const e = parseLocalDate(end);
    const sd = String(s.getDate()).padStart(2, '0');
    const ed = String(e.getDate()).padStart(2, '0');
    const sm = MESES[s.getMonth()];
    const em = MESES[e.getMonth()];
    const sy = s.getFullYear();
    const ey = e.getFullYear();

    return sy === ey
        ? `${sd} ${sm} - ${ed} ${em} ${ey}`
        : `${sd} ${sm} ${sy} - ${ed} ${em} ${ey}`;
};

// 05/10/2025 (formato numérico es-CO)
export const formatNumericDate = (dateString: string): string => {
    const d = parseLocalDate(dateString);
    return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
};
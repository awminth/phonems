import XLSX from 'xlsx-js-style';

/**
 * Export data to styled Excel file using xlsx-js-style
 * @param title Report Title (will be centered and styled)
 * @param headers Array of column headers
 * @param data Array of arrays representing table rows
 * @param filename Output filename (e.g., 'cash_report.xlsx')
 * @param sheetName Name of the sheet
 */
export const exportStyledExcel = (
    title: string,
    headers: string[],
    data: any[][],
    filename: string,
    sheetName: string = 'Report'
) => {
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([]);

    // 1. Add Title (Row 0)
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });
    
    // Merge title cells across all columns
    const range = { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(headers.length - 1, 0) } };
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(range);

    // Style Title
    ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E293B" } }, // Slate 800
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };
    
    // Set title row height
    if (!ws['!rows']) ws['!rows'] = [];
    ws['!rows'][0] = { hpt: 35 };

    // 2. Add Headers (Row 1)
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A2" });

    // Style Headers
    const headerStyle = {
        font: { bold: true, color: { rgb: "000000" }, sz: 11 },
        fill: { fgColor: { rgb: "CBD5E1" } }, // Slate 300
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    for (let i = 0; i < headers.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: i });
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }
    
    // Set header row height
    ws['!rows'][1] = { hpt: 25 };

    // 3. Add Data (Starting from Row 2)
    XLSX.utils.sheet_add_aoa(ws, data, { origin: "A3" });

    // Style Data Cells
    const dataStyle = {
        font: { sz: 10 },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "94A3B8" } }, // Slate 400
            bottom: { style: "thin", color: { rgb: "94A3B8" } },
            left: { style: "thin", color: { rgb: "94A3B8" } },
            right: { style: "thin", color: { rgb: "94A3B8" } }
        }
    };

    const numStyle = { ...dataStyle, alignment: { horizontal: "right", vertical: "center" } };

    for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < headers.length; c++) {
            const cellRef = XLSX.utils.encode_cell({ r: r + 2, c: c });
            if (ws[cellRef]) {
                const val = data[r][c];
                // Check if it's a number (excluding numeric strings)
                const isNum = typeof val === 'number';
                ws[cellRef].s = isNum ? numStyle : dataStyle;
            }
        }
    }

    // 4. Auto-fit column widths
    const wscols = headers.map((h, i) => {
        let maxLen = h.length;
        data.forEach(row => {
            const cellVal = row[i] ? row[i].toString() : '';
            if (cellVal.length > maxLen) maxLen = cellVal.length;
        });
        return { wch: Math.min(maxLen + 4, 60) }; // Cap at 60 width
    });
    ws['!cols'] = wscols;

    // Create workbook and download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
};

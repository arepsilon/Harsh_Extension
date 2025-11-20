let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function _assertChar(c) {
    if (typeof(c) === 'number' && (c >= 0x110000 || (c >= 0xD800 && c < 0xE000))) throw new Error(`expected a valid Unicode scalar value, found ${c}`);
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    const mem = getDataViewMemory0();
    for (let i = 0; i < array.length; i++) {
        mem.setUint32(ptr + 4 * i, addHeapObject(array[i]), true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

export function start() {
    wasm.start();
}

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}
 */
export const ChartDataLabelPosition = Object.freeze({
    Default: 0, "0": "Default",
    Center: 1, "1": "Center",
    Right: 2, "2": "Right",
    Left: 3, "3": "Left",
    Above: 4, "4": "Above",
    Below: 5, "5": "Below",
    InsideBase: 6, "6": "InsideBase",
    InsideEnd: 7, "7": "InsideEnd",
    OutsideEnd: 8, "8": "OutsideEnd",
    BestFit: 9, "9": "BestFit",
});
/**
 * @enum {0 | 1 | 2 | 3}
 */
export const ChartLegendPosition = Object.freeze({
    Bottom: 0, "0": "Bottom",
    Left: 1, "1": "Left",
    Right: 2, "2": "Right",
    Top: 3, "3": "Top",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}
 */
export const ChartLineDashType = Object.freeze({
    /**
     * Solid - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_solid.png">
     */
    Solid: 0, "0": "Solid",
    /**
     * Round dot - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_round_dot.png">
     */
    RoundDot: 1, "1": "RoundDot",
    /**
     * Square dot - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_square_dot.png">
     */
    SquareDot: 2, "2": "SquareDot",
    /**
     * Dash - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_dash.png">
     */
    Dash: 3, "3": "Dash",
    /**
     * Dash dot - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_dash_dot.png">
     */
    DashDot: 4, "4": "DashDot",
    /**
     * Long dash - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_longdash.png">
     */
    LongDash: 5, "5": "LongDash",
    /**
     * Long dash dot - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_longdash_dot.png">
     */
    LongDashDot: 6, "6": "LongDashDot",
    /**
     * Long dash dot dot - chart line/border dash type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_line_dash_longdash_dot_dot.png">
     */
    LongDashDotDot: 7, "7": "LongDashDotDot",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
 */
export const ChartMarkerType = Object.freeze({
    Square: 0, "0": "Square",
    Diamond: 1, "1": "Diamond",
    Triangle: 2, "2": "Triangle",
    X: 3, "3": "X",
    Star: 4, "4": "Star",
    ShortDash: 5, "5": "ShortDash",
    LongDash: 6, "6": "LongDash",
    Circle: 7, "7": "Circle",
    PlusSign: 8, "8": "PlusSign",
});
/**
 * The `ChartType` enum define the type of a {@link Chart} object.
 *
 * The main original chart types are supported, see below.
 *
 * Support for newer Excel chart types such as Treemap, Sunburst, Box and
 * Whisker, Statistical Histogram, Waterfall, Funnel and Maps is not currently
 * planned since the underlying structure is substantially different from the
 * implemented chart types.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22}
 */
export const ChartType = Object.freeze({
    /**
     * An Area chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_area.png">
     */
    Area: 0, "0": "Area",
    /**
     * A stacked Area chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_area_stacked.png">
     */
    AreaStacked: 1, "1": "AreaStacked",
    /**
     * A percent stacked Area chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_area_percent_stacked.png">
     */
    AreaPercentStacked: 2, "2": "AreaPercentStacked",
    /**
     * A Bar (horizontal histogram) chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_bar.png">
     */
    Bar: 3, "3": "Bar",
    /**
     * A stacked Bar chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_bar_stacked.png">
     */
    BarStacked: 4, "4": "BarStacked",
    /**
     * A percent stacked Bar chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_bar_percent_stacked.png">
     */
    BarPercentStacked: 5, "5": "BarPercentStacked",
    /**
     * A Column (vertical histogram) chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_column.png">
     */
    Column: 6, "6": "Column",
    /**
     * A stacked Column chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_column_stacked.png">
     */
    ColumnStacked: 7, "7": "ColumnStacked",
    /**
     * A percent stacked Column chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_column_percent_stacked.png">
     */
    ColumnPercentStacked: 8, "8": "ColumnPercentStacked",
    /**
     * A Doughnut chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_doughnut.png">
     */
    Doughnut: 9, "9": "Doughnut",
    /**
     * An Line chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_line.png">
     */
    Line: 10, "10": "Line",
    /**
     * A stacked Line chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_line_stacked.png">
     */
    LineStacked: 11, "11": "LineStacked",
    /**
     * A percent stacked Line chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_line_percent_stacked.png">
     */
    LinePercentStacked: 12, "12": "LinePercentStacked",
    /**
     * A Pie chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_pie.png">
     */
    Pie: 13, "13": "Pie",
    /**
     * A Radar chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_radar.png">
     */
    Radar: 14, "14": "Radar",
    /**
     * A Radar with markers chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_radar_with_markers.png">
     */
    RadarWithMarkers: 15, "15": "RadarWithMarkers",
    /**
     * A filled Radar chart type.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_radar_filled.png">
     */
    RadarFilled: 16, "16": "RadarFilled",
    /**
     * A Scatter chart type. Scatter charts, and their variant, are the only
     * type that have values (as opposed to categories) for their X-Axis. The
     * default scatter chart in Excel has markers for each point but no
     * connecting lines.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_scatter.png">
     */
    Scatter: 17, "17": "Scatter",
    /**
     * A Scatter chart type where the points are connected by straight lines.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_scatter_straight.png">
     */
    ScatterStraight: 18, "18": "ScatterStraight",
    /**
     * A Scatter chart type where the points have markers and are connected by
     * straight lines.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_scatter_straight_with_markers.png">
     */
    ScatterStraightWithMarkers: 19, "19": "ScatterStraightWithMarkers",
    /**
     * A Scatter chart type where the points are connected by smoothed lines.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_scatter_smooth.png">
     */
    ScatterSmooth: 20, "20": "ScatterSmooth",
    /**
     * A Scatter chart type where the points have markers and are connected by
     * smoothed lines.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_scatter_smooth_with_markers.png">
     */
    ScatterSmoothWithMarkers: 21, "21": "ScatterSmoothWithMarkers",
    /**
     * A Stock chart showing Open-High-Low-Close data. It is also possible to
     * show High-Low-Close data.
     *
     * Note, Volume variants of the Excel stock charts aren't currently
     * supported but will be in a future release.
     *
     * <img src="https://rustxlsxwriter.github.io/images/chart_type_stock.png">
     */
    Stock: 22, "22": "Stock",
});
/**
 * The `FormatAlign` enum defines the vertical and horizontal alignment properties
 * of a {@link Format}.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}
 */
export const FormatAlign = Object.freeze({
    /**
     * General/default alignment. The cell will use Excel's default for the
     * data type, for example Left for text and Right for numbers.
     */
    General: 0, "0": "General",
    /**
     * Align text to the left.
     */
    Left: 1, "1": "Left",
    /**
     * Center text horizontally.
     */
    Center: 2, "2": "Center",
    /**
     * Align text to the right.
     */
    Right: 3, "3": "Right",
    /**
     * Fill (repeat) the text horizontally across the cell.
     */
    Fill: 4, "4": "Fill",
    /**
     * Aligns the text to the left and right of the cell, if the text exceeds
     * the width of the cell.
     */
    Justify: 5, "5": "Justify",
    /**
     * Center the text across the cell or cells that have this alignment. This
     * is an older form of merged cells.
     */
    CenterAcross: 6, "6": "CenterAcross",
    /**
     * Distribute the words in the text evenly across the cell.
     */
    Distributed: 7, "7": "Distributed",
    /**
     * Align text to the top.
     */
    Top: 8, "8": "Top",
    /**
     * Align text to the bottom.
     */
    Bottom: 9, "9": "Bottom",
    /**
     * Center text vertically.
     */
    VerticalCenter: 10, "10": "VerticalCenter",
    /**
     * Aligns the text to the top and bottom of the cell, if the text exceeds
     * the height of the cell.
     */
    VerticalJustify: 11, "11": "VerticalJustify",
    /**
     * Distribute the words in the text evenly from top to bottom in the cell.
     */
    VerticalDistributed: 12, "12": "VerticalDistributed",
});
/**
 * The `FormatBorder` enum defines the Excel border types that can be added to
 * a {@link Format} pattern.
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13}
 */
export const FormatBorder = Object.freeze({
    /**
     * No border.
     */
    None: 0, "0": "None",
    /**
     * Thin border style.
     */
    Thin: 1, "1": "Thin",
    /**
     * Medium border style.
     */
    Medium: 2, "2": "Medium",
    /**
     * Dashed border style.
     */
    Dashed: 3, "3": "Dashed",
    /**
     * Dotted border style.
     */
    Dotted: 4, "4": "Dotted",
    /**
     * Thick border style.
     */
    Thick: 5, "5": "Thick",
    /**
     * Double border style.
     */
    Double: 6, "6": "Double",
    /**
     * Hair border style.
     */
    Hair: 7, "7": "Hair",
    /**
     * Medium dashed border style.
     */
    MediumDashed: 8, "8": "MediumDashed",
    /**
     * Dash-dot border style.
     */
    DashDot: 9, "9": "DashDot",
    /**
     * Medium dash-dot border style.
     */
    MediumDashDot: 10, "10": "MediumDashDot",
    /**
     * Dash-dot-dot border style.
     */
    DashDotDot: 11, "11": "DashDotDot",
    /**
     * Medium dash-dot-dot border style.
     */
    MediumDashDotDot: 12, "12": "MediumDashDotDot",
    /**
     * Slant dash-dot border style.
     */
    SlantDashDot: 13, "13": "SlantDashDot",
});
/**
 * The `FormatDiagonalBorder` enum defines {@link Format} diagonal border types.
 *
 * This is used with the {@link Format#setBorderDiagonal} method.
 * @enum {0 | 1 | 2 | 3}
 */
export const FormatDiagonalBorder = Object.freeze({
    /**
     * The default/automatic format for an Excel font.
     */
    None: 0, "0": "None",
    /**
     * Cell diagonal border from bottom left to top right.
     */
    BorderUp: 1, "1": "BorderUp",
    /**
     * Cell diagonal border from top left to bottom right.
     */
    BorderDown: 2, "2": "BorderDown",
    /**
     * Cell diagonal border in both directions.
     */
    BorderUpDown: 3, "3": "BorderUpDown",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18}
 */
export const FormatPattern = Object.freeze({
    /**
     * Automatic or Empty pattern.
     */
    None: 0, "0": "None",
    /**
     * Solid pattern.
     */
    Solid: 1, "1": "Solid",
    /**
     * Medium gray pattern.
     */
    MediumGray: 2, "2": "MediumGray",
    /**
     * Dark gray pattern.
     */
    DarkGray: 3, "3": "DarkGray",
    /**
     * Light gray pattern.
     */
    LightGray: 4, "4": "LightGray",
    /**
     * Dark horizontal line pattern.
     */
    DarkHorizontal: 5, "5": "DarkHorizontal",
    /**
     * Dark vertical line pattern.
     */
    DarkVertical: 6, "6": "DarkVertical",
    /**
     * Dark diagonal stripe pattern.
     */
    DarkDown: 7, "7": "DarkDown",
    /**
     * Reverse dark diagonal stripe pattern.
     */
    DarkUp: 8, "8": "DarkUp",
    /**
     * Dark grid pattern.
     */
    DarkGrid: 9, "9": "DarkGrid",
    /**
     * Dark trellis pattern.
     */
    DarkTrellis: 10, "10": "DarkTrellis",
    /**
     * Light horizontal Line pattern.
     */
    LightHorizontal: 11, "11": "LightHorizontal",
    /**
     * Light vertical line pattern.
     */
    LightVertical: 12, "12": "LightVertical",
    /**
     * Light diagonal stripe pattern.
     */
    LightDown: 13, "13": "LightDown",
    /**
     * Reverse light diagonal stripe pattern.
     */
    LightUp: 14, "14": "LightUp",
    /**
     * Light grid pattern.
     */
    LightGrid: 15, "15": "LightGrid",
    /**
     * Light trellis pattern.
     */
    LightTrellis: 16, "16": "LightTrellis",
    /**
     * 12.5% gray pattern.
     */
    Gray125: 17, "17": "Gray125",
    /**
     * 6.25% gray pattern.
     */
    Gray0625: 18, "18": "Gray0625",
});
/**
 * The `FormatScript` enum defines the {@link Format} font superscript and subscript
 * properties.
 * @enum {0 | 1 | 2}
 */
export const FormatScript = Object.freeze({
    /**
     * The default/automatic format for an Excel font.
     */
    None: 0, "0": "None",
    /**
     * The cell text is superscripted.
     */
    Superscript: 1, "1": "Superscript",
    /**
     * The cell text is subscripted.
     */
    Subscript: 2, "2": "Subscript",
});
/**
 * The `FormatUnderline` enum defines the font underline type in a {@link Format}.
 *
 * The difference between a normal underline and an "accounting" underline is
 * that a normal underline only underlines the text/number in a cell whereas an
 * accounting underline underlines the entire cell width.
 *
 * TODO: example omitted
 * @enum {0 | 1 | 2 | 3 | 4}
 */
export const FormatUnderline = Object.freeze({
    /**
     * The default/automatic underline for an Excel font.
     */
    None: 0, "0": "None",
    /**
     * A single underline under the text/number in a cell.
     */
    Single: 1, "1": "Single",
    /**
     * A double underline under the text/number in a cell.
     */
    Double: 2, "2": "Double",
    /**
     * A single accounting style underline under the entire cell.
     */
    SingleAccounting: 3, "3": "SingleAccounting",
    /**
     * A double accounting style underline under the entire cell.
     */
    DoubleAccounting: 4, "4": "DoubleAccounting",
});
/**
 * @enum {0 | 1 | 2}
 */
export const HeaderImagePosition = Object.freeze({
    Left: 0, "0": "Left",
    Center: 1, "1": "Center",
    Right: 2, "2": "Right",
});
/**
 * The `ObjectMovement` enum defines how a worksheet object (like an image or chart) will behave
 * if the cells under the object are moved, deleted, or have their size changed.
 * @enum {0 | 1 | 2 | 3}
 */
export const ObjectMovement = Object.freeze({
    /**
     * Move and size the worksheet object with the cells. Default for charts.
     */
    MoveAndSizeWithCells: 0, "0": "MoveAndSizeWithCells",
    /**
     * Move but don't size the worksheet object with the cells. Default for
     * images.
     */
    MoveButDontSizeWithCells: 1, "1": "MoveButDontSizeWithCells",
    /**
     * Don't move or size the worksheet object with the cells.
     */
    DontMoveOrSizeWithCells: 2, "2": "DontMoveOrSizeWithCells",
    /**
     * Same as `MoveAndSizeWithCells` except hidden cells are applied after the
     * object is inserted. This allows the insertion of objects into hidden
     * rows or columns.
     */
    MoveAndSizeWithCellsAfter: 3, "3": "MoveAndSizeWithCellsAfter",
});
/**
 * The `TableStyle` enum defines the worksheet table styles.
 *
 * Excel supports 61 different styles for tables divided into Light, Medium and
 * Dark categories. You can set one of these styles using a `TableStyle` enum
 * value.
 *
 * <img src="https://rustxlsxwriter.github.io/images/table_styles.png">
 *
 * The style is set via the {@link Table#setStyle} method. The default table
 * style in Excel is equivalent to {@link TableStyle#Medium9}.
 *
 * TODO: example omitted
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59 | 60}
 */
export const TableStyle = Object.freeze({
    /**
     * No table style.
     */
    None: 0, "0": "None",
    /**
     * Table Style Light 1, White.
     */
    Light1: 1, "1": "Light1",
    /**
     * Table Style Light 2, Light Blue.
     */
    Light2: 2, "2": "Light2",
    /**
     * Table Style Light 3, Light Orange.
     */
    Light3: 3, "3": "Light3",
    /**
     * Table Style Light 4, White.
     */
    Light4: 4, "4": "Light4",
    /**
     * Table Style Light 5, Light Yellow.
     */
    Light5: 5, "5": "Light5",
    /**
     * Table Style Light 6, Light Blue.
     */
    Light6: 6, "6": "Light6",
    /**
     * Table Style Light 7, Light Green.
     */
    Light7: 7, "7": "Light7",
    /**
     * Table Style Light 8, White.
     */
    Light8: 8, "8": "Light8",
    /**
     * Table Style Light 9, Blue.
     */
    Light9: 9, "9": "Light9",
    /**
     * Table Style Light 10, Orange.
     */
    Light10: 10, "10": "Light10",
    /**
     * Table Style Light 11, White.
     */
    Light11: 11, "11": "Light11",
    /**
     * Table Style Light 12, Gold.
     */
    Light12: 12, "12": "Light12",
    /**
     * Table Style Light 13, Blue.
     */
    Light13: 13, "13": "Light13",
    /**
     * Table Style Light 14, Green.
     */
    Light14: 14, "14": "Light14",
    /**
     * Table Style Light 15, White.
     */
    Light15: 15, "15": "Light15",
    /**
     * Table Style Light 16, Light Blue.
     */
    Light16: 16, "16": "Light16",
    /**
     * Table Style Light 17, Light Orange.
     */
    Light17: 17, "17": "Light17",
    /**
     * Table Style Light 18, White.
     */
    Light18: 18, "18": "Light18",
    /**
     * Table Style Light 19, Light Yellow.
     */
    Light19: 19, "19": "Light19",
    /**
     * Table Style Light 20, Light Blue.
     */
    Light20: 20, "20": "Light20",
    /**
     * Table Style Light 21, Light Green.
     */
    Light21: 21, "21": "Light21",
    /**
     * Table Style Medium 1, White.
     */
    Medium1: 22, "22": "Medium1",
    /**
     * Table Style Medium 2, Blue.
     */
    Medium2: 23, "23": "Medium2",
    /**
     * Table Style Medium 3, Orange.
     */
    Medium3: 24, "24": "Medium3",
    /**
     * Table Style Medium 4, White.
     */
    Medium4: 25, "25": "Medium4",
    /**
     * Table Style Medium 5, Gold.
     */
    Medium5: 26, "26": "Medium5",
    /**
     * Table Style Medium 6, Blue.
     */
    Medium6: 27, "27": "Medium6",
    /**
     * Table Style Medium 7, Green.
     */
    Medium7: 28, "28": "Medium7",
    /**
     * Table Style Medium 8, Light Grey.
     */
    Medium8: 29, "29": "Medium8",
    /**
     * Table Style Medium 9, Blue.
     */
    Medium9: 30, "30": "Medium9",
    /**
     * Table Style Medium 10, Orange.
     */
    Medium10: 31, "31": "Medium10",
    /**
     * Table Style Medium 11, Light Grey.
     */
    Medium11: 32, "32": "Medium11",
    /**
     * Table Style Medium 12, Gold.
     */
    Medium12: 33, "33": "Medium12",
    /**
     * Table Style Medium 13, Blue.
     */
    Medium13: 34, "34": "Medium13",
    /**
     * Table Style Medium 14, Green.
     */
    Medium14: 35, "35": "Medium14",
    /**
     * Table Style Medium 15, White.
     */
    Medium15: 36, "36": "Medium15",
    /**
     * Table Style Medium 16, Blue.
     */
    Medium16: 37, "37": "Medium16",
    /**
     * Table Style Medium 17, Orange.
     */
    Medium17: 38, "38": "Medium17",
    /**
     * Table Style Medium 18, White.
     */
    Medium18: 39, "39": "Medium18",
    /**
     * Table Style Medium 19, Gold.
     */
    Medium19: 40, "40": "Medium19",
    /**
     * Table Style Medium 20, Blue.
     */
    Medium20: 41, "41": "Medium20",
    /**
     * Table Style Medium 21, Green.
     */
    Medium21: 42, "42": "Medium21",
    /**
     * Table Style Medium 22, Light Grey.
     */
    Medium22: 43, "43": "Medium22",
    /**
     * Table Style Medium 23, Light Blue.
     */
    Medium23: 44, "44": "Medium23",
    /**
     * Table Style Medium 24, Light Orange.
     */
    Medium24: 45, "45": "Medium24",
    /**
     * Table Style Medium 25, Light Grey.
     */
    Medium25: 46, "46": "Medium25",
    /**
     * Table Style Medium 26, Light Yellow.
     */
    Medium26: 47, "47": "Medium26",
    /**
     * Table Style Medium 27, Light Blue.
     */
    Medium27: 48, "48": "Medium27",
    /**
     * Table Style Medium 28, Light Green.
     */
    Medium28: 49, "49": "Medium28",
    /**
     * Table Style Dark 1, Dark Grey.
     */
    Dark1: 50, "50": "Dark1",
    /**
     * Table Style Dark 2, Dark Blue.
     */
    Dark2: 51, "51": "Dark2",
    /**
     * Table Style Dark 3, Brown.
     */
    Dark3: 52, "52": "Dark3",
    /**
     * Table Style Dark 4, Grey.
     */
    Dark4: 53, "53": "Dark4",
    /**
     * Table Style Dark 5, Dark Yellow.
     */
    Dark5: 54, "54": "Dark5",
    /**
     * Table Style Dark 6, Blue.
     */
    Dark6: 55, "55": "Dark6",
    /**
     * Table Style Dark 7, Dark Green.
     */
    Dark7: 56, "56": "Dark7",
    /**
     * Table Style Dark 8, Light Grey.
     */
    Dark8: 57, "57": "Dark8",
    /**
     * Table Style Dark 9, Light Orange.
     */
    Dark9: 58, "58": "Dark9",
    /**
     * Table Style Dark 10, Gold.
     */
    Dark10: 59, "59": "Dark10",
    /**
     * Table Style Dark 11, Green.
     */
    Dark11: 60, "60": "Dark11",
});

const ChartFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chart_free(ptr >>> 0, 1));

export class Chart {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Chart.prototype);
        obj.__wbg_ptr = ptr;
        ChartFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chart_free(ptr, 0);
    }
    /**
     * Create a new Chart object.
     *
     * Create a new Chart object that can be inserted into a worksheet.
     *
     * @param {u8} chart_type - The type of the chart.
     * @returns {Chart} - The Chart object.
     * @param {ChartType} chart_type
     */
    constructor(chart_type) {
        const ret = wasm.chart_new(chart_type);
        this.__wbg_ptr = ret >>> 0;
        ChartFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Chart}
     */
    static newArea() {
        const ret = wasm.chart_newArea();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newBar() {
        const ret = wasm.chart_newBar();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newColumn() {
        const ret = wasm.chart_newColumn();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newColumnStacked() {
        const ret = wasm.chart_newColumnStacked();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newLine() {
        const ret = wasm.chart_newLine();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newPie() {
        const ret = wasm.chart_newPie();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newRadar() {
        const ret = wasm.chart_newRadar();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newScatter() {
        const ret = wasm.chart_newScatter();
        return Chart.__wrap(ret);
    }
    /**
     * @returns {Chart}
     */
    static newStock() {
        const ret = wasm.chart_newStock();
        return Chart.__wrap(ret);
    }
    /**
     * @param {ChartSeries} series
     * @returns {Chart}
     */
    pushSeries(series) {
        _assertClass(series, ChartSeries);
        const ret = wasm.chart_pushSeries(this.__wbg_ptr, series.__wbg_ptr);
        return Chart.__wrap(ret);
    }
    /**
     * @returns {ChartTitle}
     */
    title() {
        const ret = wasm.chart_legend(this.__wbg_ptr);
        return ChartTitle.__wrap(ret);
    }
    /**
     * Set a user defined name for a chart.
     *
     * By default Excel names charts as "Chart 1", "Chart 2", etc. This name
     * shows up in the formula bar and can be used to find or reference a
     * chart.
     *
     * The set_name() method allows you to give the chart a user
     * defined name.
     *
     * @param {string} name - A user defined name for the chart.
     * @returns {Chart} - The Chart object.
     */
    setName(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chart_setName(this.__wbg_ptr, ptr0, len0);
        return Chart.__wrap(ret);
    }
    setAltText(alt_text) {
        const ptr0 = passStringToWasm0(alt_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chart_setAltText(this.__wbg_ptr, ptr0, len0);
        return Chart.__wrap(ret);
    }
    setWidth(width) {
        const ret = wasm.chart_setWidth(this.__wbg_ptr, width);
        return Chart.__wrap(ret);
    }
    setHeight(height) {
        const ret = wasm.chart_setHeight(this.__wbg_ptr, height);
        return Chart.__wrap(ret);
    }
    xAxis() {
        const ret = wasm.chart_xAxis(this.__wbg_ptr);
        return ChartAxis.__wrap(ret);
    }
    yAxis() {
        const ret = wasm.chart_yAxis(this.__wbg_ptr);
        return ChartAxis.__wrap(ret);
    }
    x2Axis() {
        const ret = wasm.chart_x2Axis(this.__wbg_ptr);
        return ChartAxis.__wrap(ret);
    }
    y2Axis() {
        const ret = wasm.chart_y2Axis(this.__wbg_ptr);
        return ChartAxis.__wrap(ret);
    }
    legend() {
        const ret = wasm.chart_legend(this.__wbg_ptr);
        return ChartLegend.__wrap(ret);
    }
}

const ChartAxisFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartaxis_free(ptr >>> 0, 1));

export class ChartAxis {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartAxis.prototype);
        obj.__wbg_ptr = ptr;
        ChartAxisFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartAxisFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartaxis_free(ptr, 0);
    }
    setName(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartaxis_setName(this.__wbg_ptr, ptr0, len0);
        return ChartAxis.__wrap(ret);
    }
    setNumFormat(num_format) {
        const ptr0 = passStringToWasm0(num_format, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartaxis_setNumFormat(this.__wbg_ptr, ptr0, len0);
        return ChartAxis.__wrap(ret);
    }
    setMin(min) {
        const ret = wasm.chartaxis_setMin(this.__wbg_ptr, min);
        return ChartAxis.__wrap(ret);
    }
    setMax(max) {
        const ret = wasm.chartaxis_setMax(this.__wbg_ptr, max);
        return ChartAxis.__wrap(ret);
    }
    setFont(font) {
        _assertClass(font, ChartFont);
        const ret = wasm.chartaxis_setFont(this.__wbg_ptr, font.__wbg_ptr);
        return ChartAxis.__wrap(ret);
    }
    setNameFont(font) {
        _assertClass(font, ChartFont);
        const ret = wasm.chartaxis_setNameFont(this.__wbg_ptr, font.__wbg_ptr);
        return ChartAxis.__wrap(ret);
    }
}

const ChartDataLabelFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartdatalabel_free(ptr >>> 0, 1));

export class ChartDataLabel {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartDataLabel.prototype);
        obj.__wbg_ptr = ptr;
        ChartDataLabelFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartDataLabelFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartdatalabel_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.chartdatalabel_new();
        this.__wbg_ptr = ret >>> 0;
        ChartDataLabelFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {ChartDataLabel}
     */
    showValue() {
        const ret = wasm.chartdatalabel_showValue(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showCategoryName() {
        const ret = wasm.chartdatalabel_showCategoryName(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showSeriesName() {
        const ret = wasm.chartdatalabel_showSeriesName(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showLeaderLines() {
        const ret = wasm.chartdatalabel_showLeaderLines(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showLegendKey() {
        const ret = wasm.chartdatalabel_showLegendKey(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showPercentage() {
        const ret = wasm.chartdatalabel_showPercentage(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @param {ChartDataLabelPosition} position
     * @returns {ChartDataLabel}
     */
    setPosition(position) {
        const ret = wasm.chartdatalabel_setPosition(this.__wbg_ptr, position);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @param {ChartFont} font
     * @returns {ChartDataLabel}
     */
    setFont(font) {
        _assertClass(font, ChartFont);
        const ret = wasm.chartdatalabel_setFont(this.__wbg_ptr, font.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @param {ChartFormat} format
     * @returns {ChartDataLabel}
     */
    setFormat(format) {
        _assertClass(format, ChartFormat);
        const ret = wasm.chartdatalabel_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @param {string} num_format
     * @returns {ChartDataLabel}
     */
    setNumFormat(num_format) {
        const ptr0 = passStringToWasm0(num_format, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartdatalabel_setNumFormat(this.__wbg_ptr, ptr0, len0);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @param {string} separator
     * @returns {ChartDataLabel}
     */
    setSeparator(separator) {
        const char0 = separator.codePointAt(0);
        _assertChar(char0);
        const ret = wasm.chartdatalabel_setSeparator(this.__wbg_ptr, char0);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showYValue() {
        const ret = wasm.chartdatalabel_showValue(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    showXValue() {
        const ret = wasm.chartdatalabel_showCategoryName(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    setHidden() {
        const ret = wasm.chartdatalabel_setHidden(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @param {string} value
     * @returns {ChartDataLabel}
     */
    setValue(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartdatalabel_setValue(this.__wbg_ptr, ptr0, len0);
        return ChartDataLabel.__wrap(ret);
    }
    /**
     * @returns {ChartDataLabel}
     */
    toCustom() {
        const ret = wasm.chartdatalabel_toCustom(this.__wbg_ptr);
        return ChartDataLabel.__wrap(ret);
    }
}

const ChartFontFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartfont_free(ptr >>> 0, 1));
/**
 * The `ChartFont` struct represents a chart font.
 *
 * The `ChartFont` struct is used to define the font properties for chart elements
 * such as chart titles, axis labels, data labels and other text elements in a chart.
 *
 * It is used in conjunction with the {@link Chart} struct.
 */
export class ChartFont {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartFont.prototype);
        obj.__wbg_ptr = ptr;
        ChartFontFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartFontFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartfont_free(ptr, 0);
    }
    /**
     * Create a new `ChartFont` object.
     */
    constructor() {
        const ret = wasm.chartfont_new();
        this.__wbg_ptr = ret >>> 0;
        ChartFontFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the font bold property.
     *
     * @return {ChartFont} - The ChartFont instance.
     * @returns {ChartFont}
     */
    setBold() {
        const ret = wasm.chartfont_setBold(this.__wbg_ptr);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font character set value.
     *
     * Set the font character set value using the standard Windows values.
     * This is generally only required when using non-standard fonts.
     *
     * @param {number} charset - The font character set value.
     * @return {ChartFont} - The ChartFont instance.
     * @param {number} character_set
     * @returns {ChartFont}
     */
    setCharacterSet(character_set) {
        const ret = wasm.chartfont_setCharacterSet(this.__wbg_ptr, character_set);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font color property.
     *
     * @param {Color} color - The font color property.
     * @return {ChartFont} - The ChartFont instance.
     * @param {Color} color
     * @returns {ChartFont}
     */
    setColor(color) {
        _assertClass(color, Color);
        const ret = wasm.chartfont_setColor(this.__wbg_ptr, color.__wbg_ptr);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font italic property.
     *
     * @return {ChartFont} - The ChartFont instance.
     * @returns {ChartFont}
     */
    setItalic() {
        const ret = wasm.chartfont_setItalic(this.__wbg_ptr);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font name/family property.
     *
     * Set the font name for the chart element. Excel can only display fonts that
     * are installed on the system that it is running on. Therefore it is generally
     * best to use standard Excel fonts.
     *
     * @param {string} name - The font name property.
     * @return {ChartFont} - The ChartFont instance.
     * @param {string} name
     * @returns {ChartFont}
     */
    setName(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartfont_setName(this.__wbg_ptr, ptr0, len0);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font pitch and family value.
     *
     * Set the font pitch and family value using the standard Windows values.
     * This is generally only required when using non-standard fonts.
     *
     * @param {number} pitch_family - The font pitch and family value.
     * @return {ChartFont} - The ChartFont instance.
     * @param {number} pitch_family
     * @returns {ChartFont}
     */
    setPitchFamily(pitch_family) {
        const ret = wasm.chartfont_setPitchFamily(this.__wbg_ptr, pitch_family);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the right to left property.
     *
     * Set the right to left property. This is generally only required when using
     * non-standard fonts.
     *
     * @param {boolean} enable - Turn the property on/off. Defaults to true.
     * @return {ChartFont} - The ChartFont instance.
     * @param {boolean} enable
     * @returns {ChartFont}
     */
    setRightToLeft(enable) {
        const ret = wasm.chartfont_setRightToLeft(this.__wbg_ptr, enable);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font rotation angle.
     *
     * Set the rotation angle of the font text in the range -90 to 90 degrees.
     *
     * @param {number} rotation - The rotation angle in degrees.
     * @return {ChartFont} - The ChartFont instance.
     * @param {number} rotation
     * @returns {ChartFont}
     */
    setRotation(rotation) {
        const ret = wasm.chartfont_setRotation(this.__wbg_ptr, rotation);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font size property.
     *
     * Set the font size for the chart element.
     *
     * @param {number} size - The font size property.
     * @return {ChartFont} - The ChartFont instance.
     * @param {number} size
     * @returns {ChartFont}
     */
    setSize(size) {
        const ret = wasm.chartfont_setSize(this.__wbg_ptr, size);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font strikethrough property.
     *
     * Set the strikethrough property. This is generally only required when using
     * non-standard fonts.
     *
     * @return {ChartFont} - The ChartFont instance.
     * @returns {ChartFont}
     */
    setStrikethrough() {
        const ret = wasm.chartfont_setStrikethrough(this.__wbg_ptr);
        return ChartFont.__wrap(ret);
    }
    /**
     * Set the font underline property.
     *
     * Set the font underline. This is generally only required when using
     * non-standard fonts.
     *
     * @param {number} underline - The font underline value.
     * @return {ChartFont} - The ChartFont instance.
     * @returns {ChartFont}
     */
    setUnderline() {
        const ret = wasm.chartfont_setUnderline(this.__wbg_ptr);
        return ChartFont.__wrap(ret);
    }
    /**
     * Unset bold property.
     *
     * Unset the bold property. This is generally only required when using
     * non-standard fonts.
     *
     * @return {ChartFont} - The ChartFont instance.
     * @returns {ChartFont}
     */
    unsetBold() {
        const ret = wasm.chartfont_unsetBold(this.__wbg_ptr);
        return ChartFont.__wrap(ret);
    }
}

const ChartFormatFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartformat_free(ptr >>> 0, 1));
/**
 * The `ChartFormat` struct represents formatting for various chart objects.
 *
 * Excel uses a standard formatting dialog for the elements of a chart such as
 * data series, the plot area, the chart area, the legend or individual points.
 * It looks like this:
 *
 * <img src="https://rustxlsxwriter.github.io/images/chart_format_dialog.png">
 *
 * The {@link ChartFormat} struct represents many of these format options and just
 * like Excel it offers a similar formatting interface for a number of the
 * chart sub-elements supported by `rust_xlsxwriter`.
 *
 * It is used in conjunction with the {@link Chart} struct.
 *
 * The {@link ChartFormat} struct is generally passed to the `set_format()` method
 * of a chart element. It supports several chart formatting elements such as:
 *
 * - {@link ChartFormat#setSolidFill}: Set the {@link ChartSolidFill} properties.
 * - {@link ChartFormat#setPatternFill}: Set the {@link ChartPatternFill}
 *   properties.
 * - {@link ChartFormat#setGradientFill}: Set the {@link ChartGradientFill}
 *   properties.
 * - {@link ChartFormat#setNoFill}: Turn off the fill for the chart object.
 * - {@link ChartFormat#setLine}: Set the {@link ChartLine} properties.
 * - {@link ChartFormat#setBorder}: Set the {@link ChartBorder} properties. A
 *   synonym for {@link ChartLine} depending on context.
 * - {@link ChartFormat#setNoLine}: Turn off the line for the chart object.
 * - {@link ChartFormat#setNoBorder}: Turn off the border for the chart
 *   object.
 *
 * TODO: example omitted
 */
export class ChartFormat {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartFormat.prototype);
        obj.__wbg_ptr = ptr;
        ChartFormatFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartFormatFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartformat_free(ptr, 0);
    }
    /**
     * Create a new `ChartFormat` instance to set formatting for a chart element.
     */
    constructor() {
        const ret = wasm.chartformat_new();
        this.__wbg_ptr = ret >>> 0;
        ChartFormatFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {ChartLine} line
     * @returns {ChartFormat}
     */
    setLine(line) {
        _assertClass(line, ChartLine);
        const ret = wasm.chartformat_setBorder(this.__wbg_ptr, line.__wbg_ptr);
        return ChartFormat.__wrap(ret);
    }
    /**
     * @param {ChartLine} border
     * @returns {ChartFormat}
     */
    setBorder(border) {
        _assertClass(border, ChartLine);
        const ret = wasm.chartformat_setBorder(this.__wbg_ptr, border.__wbg_ptr);
        return ChartFormat.__wrap(ret);
    }
    /**
     * @returns {ChartFormat}
     */
    setNoLine() {
        const ret = wasm.chartformat_setNoBorder(this.__wbg_ptr);
        return ChartFormat.__wrap(ret);
    }
    /**
     * @returns {ChartFormat}
     */
    setNoBorder() {
        const ret = wasm.chartformat_setNoBorder(this.__wbg_ptr);
        return ChartFormat.__wrap(ret);
    }
    /**
     * @returns {ChartFormat}
     */
    setNoFill() {
        const ret = wasm.chartformat_setNoFill(this.__wbg_ptr);
        return ChartFormat.__wrap(ret);
    }
    /**
     * @param {ChartSolidFill} fill
     * @returns {ChartFormat}
     */
    setSolidFill(fill) {
        _assertClass(fill, ChartSolidFill);
        const ret = wasm.chartformat_setSolidFill(this.__wbg_ptr, fill.__wbg_ptr);
        return ChartFormat.__wrap(ret);
    }
}

const ChartLegendFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartlegend_free(ptr >>> 0, 1));

export class ChartLegend {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartLegend.prototype);
        obj.__wbg_ptr = ptr;
        ChartLegendFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartLegendFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartlegend_free(ptr, 0);
    }
    setHidden() {
        const ret = wasm.chartlegend_setHidden(this.__wbg_ptr);
        return ChartLegend.__wrap(ret);
    }
    setPosition(position) {
        const ret = wasm.chartlegend_setPosition(this.__wbg_ptr, position);
        return ChartLegend.__wrap(ret);
    }
    setOverlay(enable) {
        const ret = wasm.chartlegend_setOverlay(this.__wbg_ptr, enable);
        return ChartLegend.__wrap(ret);
    }
    setFormat(format) {
        _assertClass(format, ChartFormat);
        const ret = wasm.chartlegend_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return ChartLegend.__wrap(ret);
    }
    setFont(font) {
        _assertClass(font, ChartFont);
        const ret = wasm.chartlegend_setFont(this.__wbg_ptr, font.__wbg_ptr);
        return ChartLegend.__wrap(ret);
    }
}

const ChartLineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartline_free(ptr >>> 0, 1));
/**
 * The `ChartLine` struct represents a chart line/border.
 *
 * The `ChartLine` struct represents the formatting properties for a line or
 * border for a Chart element. It is a sub property of the {@link ChartFormat}
 * struct and is used with the {@link ChartFormat#setLine} or
 * {@link ChartFormat#setBorder} methods.
 *
 * Excel uses the element names "Line" and "Border" depending on the context.
 * For a Line chart the line is represented by a line property but for a Column
 * chart the line becomes the border. Both of these share the same properties
 * and are both represented in `rust_xlsxwriter` by the {@link ChartLine} struct.
 *
 * As a syntactic shortcut you can use the type alias {@link ChartBorder} instead
 * of `ChartLine`.
 *
 * It is used in conjunction with the {@link Chart} struct.
 *
 * TODO: example omitted
 */
export class ChartLine {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartLine.prototype);
        obj.__wbg_ptr = ptr;
        ChartLineFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartLineFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartline_free(ptr, 0);
    }
    /**
     * Create a new `ChartLine` instance to set formatting for a chart line.
     */
    constructor() {
        const ret = wasm.chartline_new();
        this.__wbg_ptr = ret >>> 0;
        ChartLineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Color} color
     * @returns {ChartLine}
     */
    setColor(color) {
        _assertClass(color, Color);
        const ret = wasm.chartline_setColor(this.__wbg_ptr, color.__wbg_ptr);
        return ChartLine.__wrap(ret);
    }
    /**
     * @param {number} width
     * @returns {ChartLine}
     */
    setWidth(width) {
        const ret = wasm.chartline_setWidth(this.__wbg_ptr, width);
        return ChartLine.__wrap(ret);
    }
    /**
     * @param {ChartLineDashType} dash_type
     * @returns {ChartLine}
     */
    setDashType(dash_type) {
        const ret = wasm.chartline_setDashType(this.__wbg_ptr, dash_type);
        return ChartLine.__wrap(ret);
    }
    /**
     * @param {number} transparency
     * @returns {ChartLine}
     */
    setTransparency(transparency) {
        const ret = wasm.chartline_setTransparency(this.__wbg_ptr, transparency);
        return ChartLine.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {ChartLine}
     */
    setHidden(enable) {
        const ret = wasm.chartline_setHidden(this.__wbg_ptr, enable);
        return ChartLine.__wrap(ret);
    }
}

const ChartMarkerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartmarker_free(ptr >>> 0, 1));

export class ChartMarker {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartMarker.prototype);
        obj.__wbg_ptr = ptr;
        ChartMarkerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartMarkerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartmarker_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.chartmarker_new();
        this.__wbg_ptr = ret >>> 0;
        ChartMarkerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the automatic/default marker type.
     *
     * Allow the marker type to be set automatically by Excel.
     *
     * @return {ChartMarker} - The ChartMarker instance.
     * @returns {ChartMarker}
     */
    setAutomatic() {
        const ret = wasm.chartmarker_setAutomatic(this.__wbg_ptr);
        return ChartMarker.__wrap(ret);
    }
    /**
     * Set the formatting properties for a chart marker.
     *
     * @param {ChartFormat} format - The chart format properties.
     * @return {ChartMarker} - The ChartMarker instance.
     * @param {ChartFormat} format
     * @returns {ChartMarker}
     */
    setFormat(format) {
        _assertClass(format, ChartFormat);
        const ret = wasm.chartmarker_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return ChartMarker.__wrap(ret);
    }
    /**
     * Turn off/hide a chart marker.
     *
     * This method can be used to turn off markers for an individual data series
     * in a chart that has default markers for all series.
     *
     * @return {ChartMarker} - The ChartMarker instance.
     * @returns {ChartMarker}
     */
    setNone() {
        const ret = wasm.chartmarker_setNone(this.__wbg_ptr);
        return ChartMarker.__wrap(ret);
    }
    /**
     * Set the marker size.
     *
     * @param {number} size - The marker size.
     * @return {ChartMarker} - The ChartMarker instance.
     * @param {number} size
     * @returns {ChartMarker}
     */
    setSize(size) {
        const ret = wasm.chartmarker_setSize(this.__wbg_ptr, size);
        return ChartMarker.__wrap(ret);
    }
    /**
     * Set the marker type.
     *
     * @param {number} marker_type - The marker type.
     * @return {ChartMarker} - The ChartMarker instance.
     * @param {ChartMarkerType} marker_type
     * @returns {ChartMarker}
     */
    setType(marker_type) {
        const ret = wasm.chartmarker_setType(this.__wbg_ptr, marker_type);
        return ChartMarker.__wrap(ret);
    }
}

const ChartPointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartpoint_free(ptr >>> 0, 1));
/**
 * The `ChartPoint` struct represents a chart point.
 *
 * The `ChartPoint` struct represents a "point" in a data series which is the
 * element you get in Excel if you right click on an individual data point or
 * segment and select "Format Data Point".
 *
 * <img src="https://rustxlsxwriter.github.io/images/chart_point_dialog.png">
 *
 * The meaning of "point" varies between chart types. For a Line chart a point
 * is a line segment; in a Column chart a point is a an individual bar; and in
 * a Pie chart a point is a pie segment.
 *
 * Chart points are most commonly used for Pie and Doughnut charts to format
 * individual segments of the chart. In all other chart types the formatting
 * happens at the chart series level.
 *
 * It is used in conjunction with the {@link Chart} struct.
 *
 * TODO: example omitted
 */
export class ChartPoint {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartPoint.prototype);
        obj.__wbg_ptr = ptr;
        ChartPointFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof ChartPoint)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartPointFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartpoint_free(ptr, 0);
    }
    /**
     * Create a new `ChartPoint` object to represent a Chart point.
     */
    constructor() {
        const ret = wasm.chartpoint_new();
        this.__wbg_ptr = ret >>> 0;
        ChartPointFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {ChartFormat} format
     * @returns {ChartPoint}
     */
    setFormat(format) {
        _assertClass(format, ChartFormat);
        const ret = wasm.chartpoint_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return ChartPoint.__wrap(ret);
    }
}

const ChartRangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartrange_free(ptr >>> 0, 1));
/**
 * Trait to map types into an `ChartRange`.
 *
 * The 2 most common types of range used in `rust_xlsxwriter` charts are:
 *
 * - A string with an Excel like range formula such as `"Sheet1!$A$1:$A$3"`.
 * - A 5 value tuple that can be used to create the range programmatically
 *   using a sheet name and zero indexed row and column values like:
 *   `("Sheet1", 0, 0, 2, 0)` (this gives the same range as the previous string
 *   value).
 *
 * For single cell ranges used in chart items such as chart or axis titles you
 * can also use:
 *
 * - A simple string title.
 * - A string with an Excel like cell formula such as `"Sheet1!$A$1"`.
 * - A 3 value tuple that can be used to create the cell range programmatically
 *   using a sheet name and zero indexed row and column values like:
 *   `("Sheet1", 0, 0)` (this gives the same range as the previous string
 *   value).
 */
export class ChartRange {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartRange.prototype);
        obj.__wbg_ptr = ptr;
        ChartRangeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartRangeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartrange_free(ptr, 0);
    }
    /**
     * Create a new `ChartRange` from a worksheet 5 tuple.
     *
     * A 5 value tuple that can be used to create the range programmatically
     *   using a sheet name and zero indexed row and column values like:
     *   `("Sheet1", 0, 0, 2, 0)` (this gives the same range as the previous string
     *   value).
     * @param {string} sheet
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     */
    constructor(sheet, first_row, first_col, last_row, last_col) {
        const ptr0 = passStringToWasm0(sheet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartrange_new(ptr0, len0, first_row, first_col, last_row, last_col);
        this.__wbg_ptr = ret >>> 0;
        ChartRangeFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Create a new `ChartRange` from an Excel range formula such as `"Sheet1!$A$1:$A$3"`.
     *
     * TODO: example omitted
     * @param {string} range_str
     * @returns {ChartRange}
     */
    static newFromString(range_str) {
        const ptr0 = passStringToWasm0(range_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartrange_newFromString(ptr0, len0);
        return ChartRange.__wrap(ret);
    }
    /**
     * Create a new `ChartRange` from a worksheet 3 tuple.
     *
     * A 3 value tuple that can be used to create the cell range programmatically
     *   using a sheet name and zero indexed row and column values like:
     *   `("Sheet1", 0, 0)` (this gives the same range as the previous string
     *   value).
     *
     * TODO: example omitted
     * @param {string} sheet
     * @param {number} row
     * @param {number} col
     * @returns {ChartRange}
     */
    static fromCell(sheet, row, col) {
        const ptr0 = passStringToWasm0(sheet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartrange_fromCell(ptr0, len0, row, col);
        return ChartRange.__wrap(ret);
    }
}

const ChartSeriesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartseries_free(ptr >>> 0, 1));

export class ChartSeries {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartSeries.prototype);
        obj.__wbg_ptr = ptr;
        ChartSeriesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartSeriesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartseries_free(ptr, 0);
    }
    /**
     * Create a new chart series object.
     *
     * Create a new chart series object. A chart in Excel must contain at least
     * one data series. The `ChartSeries` struct represents the category and
     * value ranges, and the formatting and options for the chart series.
     *
     * It is used in conjunction with the {@link Chart} struct.
     *
     * A chart series is usually created via the {@link Chart#addSeries}
     * method, see the first example below. However, if required you can create
     * a standalone `ChartSeries` object and add it to a chart via the
     * {@link Chart#pushSeries} method, see the second example below.
     *
     * TODO: Add examples
     */
    constructor() {
        const ret = wasm.chartseries_new();
        this.__wbg_ptr = ret >>> 0;
        ChartSeriesFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Add a category range chart series.
     *
     * This method sets the chart category labels. The category is more or less
     * the same as the X axis. In most chart types the categories property is
     * optional and the chart will just assume a sequential series from `1..n`.
     * The exception to this is the Scatter chart types for which a category
     * range is mandatory in Excel.
     *
     * The data range can be set using a formula as shown in the first part of
     * the example below or using a list of values as shown in the second part.
     *
     * # Parameters
     *
     * - `range`: The range property which can be one of two generic types:
     *    - A string with an Excel like range formula such as
     *      `"Sheet1!$A$1:$A$3"`.
     *    - A tuple that can be used to create the range programmatically using
     *      a sheet name and zero indexed row and column values like:
     *      `("Sheet1", 0, 0, 2, 0)` (this gives the same range as the previous
     *      string value).
     *
     * TODO: example omitted
     */
    setCategories(range) {
        _assertClass(range, ChartRange);
        const ret = wasm.chartseries_setCategories(this.__wbg_ptr, range.__wbg_ptr);
        return ChartSeries.__wrap(ret);
    }
    /**
     * Add a name for a chart series.
     *
     * Set the name for the series. The name is displayed in the formula bar.
     * For non-Pie/Doughnut charts it is also displayed in the legend. The name
     * property is optional and if it isn’t supplied it will default to `Series
     * 1..n`. The name can be a simple string, a formula such as `Sheet1!$A$1`
     * or a tuple with a sheet name, row and column such as `('Sheet1', 0, 0)`.
     *
     * # Parameters
     *
     * - `range`: The range property which can be one of the following generic
     *   types:
     *    - A simple string title.
     *    - A string with an Excel like range formula such as `"Sheet1!$A$1"`.
     *    - A tuple that can be used to create the range programmatically using
     *      a sheet name and zero indexed row and column values like:
     *      `("Sheet1", 0, 0)` (this gives the same range as the previous
     *      string value).
     *
     * TODO: example omitted
     */
    setName(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartseries_setName(this.__wbg_ptr, ptr0, len0);
        return ChartSeries.__wrap(ret);
    }
    /**
     * Add a values range to a chart series.
     *
     * All chart series in Excel must have a data range that defines the range
     * of values for the series. In Excel this is typically a range like
     * `"Sheet1!$B$1:$B$5"`.
     *
     * This is the most important property of a series and is the only
     * mandatory option for every chart object. This series values links the
     * chart with the worksheet data that it displays. The data range can be
     * set using a formula as shown in the first part of the example below or
     * using a list of values as shown in the second part.
     *
     * # Parameters
     *
     * - `range`: The range property which can be one of two generic types:
     *    - A string with an Excel like range formula such as
     *      `"Sheet1!$A$1:$A$3"`.
     *    - A tuple that can be used to create the range programmatically using
     *      a sheet name and zero indexed row and column values like:
     *      `("Sheet1", 0, 0, 2, 0)` (this gives the same range as the previous
     *      string value).
     */
    setValues(range) {
        _assertClass(range, ChartRange);
        const ret = wasm.chartseries_setValues(this.__wbg_ptr, range.__wbg_ptr);
        return ChartSeries.__wrap(ret);
    }
    setPoints(points) {
        const ptr0 = passArrayJsValueToWasm0(points, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.chartseries_setPoints(this.__wbg_ptr, ptr0, len0);
        return ChartSeries.__wrap(ret);
    }
    setDataLabel(data_label) {
        _assertClass(data_label, ChartDataLabel);
        const ret = wasm.chartseries_setDataLabel(this.__wbg_ptr, data_label.__wbg_ptr);
        return ChartSeries.__wrap(ret);
    }
    setMarker(marker) {
        _assertClass(marker, ChartMarker);
        const ret = wasm.chartseries_setMarker(this.__wbg_ptr, marker.__wbg_ptr);
        return ChartSeries.__wrap(ret);
    }
    setFormat(format) {
        _assertClass(format, ChartFormat);
        const ret = wasm.chartseries_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return ChartSeries.__wrap(ret);
    }
}

const ChartSolidFillFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_chartsolidfill_free(ptr >>> 0, 1));
/**
 * The `ChartSolidFill` struct represents a solid fill for chart elements.
 *
 * The `ChartSolidFill` struct is used to define the solid fill properties
 * for chart elements such as plot areas, chart areas, data series, and other
 * fillable elements in a chart.
 *
 * It is used in conjunction with the {@link Chart} struct.
 */
export class ChartSolidFill {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartSolidFill.prototype);
        obj.__wbg_ptr = ptr;
        ChartSolidFillFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartSolidFillFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_chartsolidfill_free(ptr, 0);
    }
    /**
     * Create a new `ChartSolidFill` object.
     */
    constructor() {
        const ret = wasm.chartsolidfill_new();
        this.__wbg_ptr = ret >>> 0;
        ChartSolidFillFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the color of a solid fill.
     *
     * @param {Color} color - The color property.
     * @return {ChartSolidFill} - The ChartSolidFill instance.
     * @param {Color} color
     * @returns {ChartSolidFill}
     */
    setColor(color) {
        _assertClass(color, Color);
        const ret = wasm.chartsolidfill_setColor(this.__wbg_ptr, color.__wbg_ptr);
        return ChartSolidFill.__wrap(ret);
    }
    /**
     * Set the transparency of a solid fill.
     *
     * Set the transparency of a solid fill color for a Chart element.
     * You must also specify a fill color in order for the transparency to be applied.
     *
     * @param {number} transparency - The color transparency in the range 0-100.
     * @return {ChartSolidFill} - The ChartSolidFill instance.
     * @param {number} transparency
     * @returns {ChartSolidFill}
     */
    setTransparency(transparency) {
        const ret = wasm.chartsolidfill_setTransparency(this.__wbg_ptr, transparency);
        return ChartSolidFill.__wrap(ret);
    }
}

const ChartTitleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_charttitle_free(ptr >>> 0, 1));
/**
 * The `ChartTitle` struct represents a chart title.
 *
 * It is used in conjunction with the {@link Chart} struct.
 */
export class ChartTitle {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ChartTitle.prototype);
        obj.__wbg_ptr = ptr;
        ChartTitleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ChartTitleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_charttitle_free(ptr, 0);
    }
    /**
     * Add a title for a chart.
     *
     * Set the name (title) for the chart. The name is displayed above the
     * chart.
     *
     * The name can be a simple string, a formula such as `Sheet1!$A$1` or a
     * tuple with a sheet name, row and column such as `('Sheet1', 0, 0)`.
     *
     * # Parameters
     *
     * - `range`: The range property which can be one of the following generic
     *   types:
     *    - A simple string title.
     *    - A string with an Excel like range formula such as `"Sheet1!$A$1"`.
     *    - A tuple that can be used to create the range programmatically using
     *      a sheet name and zero indexed row and column values like:
     *      `("Sheet1", 0, 0)` (this gives the same range as the previous
     *      string value).
     *
     * TODO: example omitted
     */
    setName(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.charttitle_setName(this.__wbg_ptr, ptr0, len0);
        return ChartTitle.__wrap(ret);
    }
    /**
     * Set the formatting properties for a chart title.
     *
     * Set the formatting properties for a chart title via a {@link ChartFormat}
     * object or a sub struct that implements [`IntoChartFormat`].
     *
     * The formatting that can be applied via a {@link ChartFormat} object are:
     *
     * - {@link ChartFormat#setSolidFill}: Set the {@link ChartSolidFill} properties.
     * - {@link ChartFormat#setPatternFill}: Set the {@link ChartPatternFill} properties.
     * - {@link ChartFormat#setGradientFill}: Set the {@link ChartGradientFill} properties.
     * - {@link ChartFormat#setNoFill}: Turn off the fill for the chart object.
     * - {@link ChartFormat#setLine}: Set the {@link ChartLine} properties.
     * - {@link ChartFormat#setBorder}: Set the {@link ChartBorder} properties.
     *   A synonym for {@link ChartLine} depending on context.
     * - {@link ChartFormat#setNoLine}: Turn off the line for the chart object.
     * - {@link ChartFormat#setNoBorder}: Turn off the border for the chart object.
     *
     * # Parameters
     *
     * `format`: A {@link ChartFormat} struct reference or a sub struct that will
     * convert into a `ChartFormat` instance. See the docs for
     * [`IntoChartFormat`] for details.
     * @param {ChartFormat} format
     * @returns {ChartTitle}
     */
    setFormat(format) {
        _assertClass(format, ChartFormat);
        const ret = wasm.charttitle_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return ChartTitle.__wrap(ret);
    }
    setFont(font) {
        _assertClass(font, ChartFont);
        const ret = wasm.charttitle_setFont(this.__wbg_ptr, font.__wbg_ptr);
        return ChartTitle.__wrap(ret);
    }
}

const ColorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_color_free(ptr >>> 0, 1));
/**
 * The `Color` enum defines Excel colors that can be used throughout the
 * `rust_xlsxwriter` APIs.
 *
 * There are 3 types of colors within the enum:
 *
 * 1. Predefined named colors like `Color::Green`.
 * 2. User defined RGB colors such as `Color::RGB(0x4F026A)` using a format
 *    similar to html colors like `#RRGGBB`, except as an integer.
 * 3. Theme colors from the standard palette of 60 colors like `Color::Theme(9,
 *    4)`. The theme colors are shown in the image below.
 *
 *    <img
 *    src="https://rustxlsxwriter.github.io/images/theme_color_palette.png">
 *
 *    The syntax for theme colors in `Color` is `Theme(color, shade)` where
 *    `color` is one of the 0-9 values on the top row and `shade` is the
 *    variant in the associated column from 0-5. For example "White, background
 *    1" in the top left is `Theme(0, 0)` and "Orange, Accent 6, Darker 50%" in
 *    the bottom right is `Theme(9, 5)`.
 *
 * Note, there are no plans to support anything other than the default Excel
 * "Office" theme.
 */
export class Color {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Color.prototype);
        obj.__wbg_ptr = ptr;
        ColorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ColorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_color_free(ptr, 0);
    }
    /**
     * The default color for an Excel property.
     */
    constructor() {
        const ret = wasm.color_default();
        this.__wbg_ptr = ret >>> 0;
        ColorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * A user defined RGB color in the range 0x000000 (black) to 0xFFFFFF
     * (white). Any values outside this range will be ignored with a a warning.
     * @param {number} hex
     * @returns {Color}
     */
    static rgb(hex) {
        const ret = wasm.color_rgb(hex);
        return Color.__wrap(ret);
    }
    /**
     * A theme color on the default palette (see the image above). The syntax
     * for theme colors is `Theme(color, shade)` where `color` is one of the
     * 0-9 values on the top row and `shade` is the variant in the associated
     * column from 0-5. Any values outside these ranges will be ignored with a
     * a warning.
     * @param {number} color
     * @param {number} shade
     * @returns {Color}
     */
    static theme(color, shade) {
        const ret = wasm.color_theme(color, shade);
        return Color.__wrap(ret);
    }
    /**
     * The Automatic color for an Excel property. This is usually the same as
     * the `Default` color but can vary according to system settings.
     * @returns {Color}
     */
    static automatic() {
        const ret = wasm.color_automatic();
        return Color.__wrap(ret);
    }
    /**
     * Convert from a Html style color string line "#6495ED" into a {@link Color} enum value.
     * @param {string} s
     * @returns {Color}
     */
    static parse(s) {
        const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.color_parse(ptr0, len0);
        return Color.__wrap(ret);
    }
    /**
     * The color Black with a RGB value of 0x000000.
     * @returns {Color}
     */
    static black() {
        const ret = wasm.color_black();
        return Color.__wrap(ret);
    }
    /**
     * The color Blue with a RGB value of 0x0000FF.
     * @returns {Color}
     */
    static blue() {
        const ret = wasm.color_blue();
        return Color.__wrap(ret);
    }
    /**
     * The color Brown with a RGB value of 0x800000.
     * @returns {Color}
     */
    static brown() {
        const ret = wasm.color_brown();
        return Color.__wrap(ret);
    }
    /**
     * The color Cyan with a RGB value of 0x00FFFF.
     * @returns {Color}
     */
    static cyan() {
        const ret = wasm.color_cyan();
        return Color.__wrap(ret);
    }
    /**
     * The color Gray with a RGB value of 0x808080.
     * @returns {Color}
     */
    static gray() {
        const ret = wasm.color_gray();
        return Color.__wrap(ret);
    }
    /**
     * The color Green with a RGB value of 0x008000.
     * @returns {Color}
     */
    static green() {
        const ret = wasm.color_green();
        return Color.__wrap(ret);
    }
    /**
     * The color Lime with a RGB value of 0x00FF00.
     * @returns {Color}
     */
    static lime() {
        const ret = wasm.color_lime();
        return Color.__wrap(ret);
    }
    /**
     * The color Magenta with a RGB value of 0xFF00FF.
     * @returns {Color}
     */
    static magenta() {
        const ret = wasm.color_magenta();
        return Color.__wrap(ret);
    }
    /**
     * The color Navy with a RGB value of 0x000080.
     * @returns {Color}
     */
    static navy() {
        const ret = wasm.color_navy();
        return Color.__wrap(ret);
    }
    /**
     * The color Orange with a RGB value of 0xFF6600.
     * @returns {Color}
     */
    static orange() {
        const ret = wasm.color_orange();
        return Color.__wrap(ret);
    }
    /**
     * The color Pink with a RGB value of 0xFFC0CB.
     * @returns {Color}
     */
    static pink() {
        const ret = wasm.color_pink();
        return Color.__wrap(ret);
    }
    /**
     * The color Purple with a RGB value of 0x800080.
     * @returns {Color}
     */
    static purple() {
        const ret = wasm.color_purple();
        return Color.__wrap(ret);
    }
    /**
     * The color Red with a RGB value of 0xFF0000.
     * @returns {Color}
     */
    static red() {
        const ret = wasm.color_red();
        return Color.__wrap(ret);
    }
    /**
     * The color Silver with a RGB value of 0xC0C0C0.
     * @returns {Color}
     */
    static silver() {
        const ret = wasm.color_silver();
        return Color.__wrap(ret);
    }
    /**
     * The color White with a RGB value of 0xFFFFFF.
     * @returns {Color}
     */
    static white() {
        const ret = wasm.color_white();
        return Color.__wrap(ret);
    }
    /**
     * The color Yellow with a RGB value of 0xFFFF00
     * @returns {Color}
     */
    static yellow() {
        const ret = wasm.color_yellow();
        return Color.__wrap(ret);
    }
}

const DocPropertiesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_docproperties_free(ptr >>> 0, 1));
/**
 * The `DocProperties` struct is used to create an object to represent document
 * metadata properties.
 *
 * The `DocProperties` struct is used to create an object to represent various
 * document properties for an Excel file such as the Author's name or the
 * Creation Date.
 *
 * <img src="https://rustxlsxwriter.github.io/images/app_doc_properties.png">
 *
 * Document Properties can be set for the "Summary" section and also for the
 * "Custom" section of the Excel document properties. See the examples below.
 *
 * The `DocProperties` struct is used in conjunction with the
 * {@link Workbook#setProperties} method.
 *
 * TODO: example omitted
 */
export class DocProperties {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DocProperties.prototype);
        obj.__wbg_ptr = ptr;
        DocPropertiesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DocPropertiesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_docproperties_free(ptr, 0);
    }
    /**
     * Create a new `DocProperties` class.
     */
    constructor() {
        const ret = wasm.docproperties_new();
        this.__wbg_ptr = ret >>> 0;
        DocPropertiesFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the Title field of the document properties.
     *
     * Set the "Title" field of the document properties to create a title for
     * the document such as "Sales Report". See the example above.
     *
     * @param {string} title - The title string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setTitle(title) {
        const ptr0 = passStringToWasm0(title, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setTitle(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Subject field of the document properties.
     *
     * Set the "Subject" field of the document properties to indicate the
     * subject matter. See the example above.
     *
     * @param {string} subject - The subject string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setSubject(subject) {
        const ptr0 = passStringToWasm0(subject, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setSubject(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Author field of the document properties.
     *
     * Set the "Author" field of the document properties. See the example
     * above.
     *
     * @param {string} author - The author string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setAuthor(author) {
        const ptr0 = passStringToWasm0(author, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setAuthor(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Manager field of the document properties.
     *
     * Set the "Manager" field of the document properties. See the example
     * above. See the example above.
     *
     * @param {string} manager - The manager string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setManager(manager) {
        const ptr0 = passStringToWasm0(manager, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setManager(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Company field of the document properties.
     *
     * Set the "Company" field of the document properties. See the example
     * above.
     *
     * @param {string} company - The company string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setCompany(company) {
        const ptr0 = passStringToWasm0(company, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setCompany(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Category field of the document properties.
     *
     * Set the "Category" field of the document properties to indicate the
     * category that the file belongs to. See the example above.
     *
     * @param {string} category - The category string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setCategory(category) {
        const ptr0 = passStringToWasm0(category, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setCategory(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Keywords field of the document properties.
     *
     * Set the "Keywords" field of the document properties. This can be one or
     * more keywords that can be used in searches. See the example above.
     *
     * @param {string} keywords - The keywords string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setKeywords(keywords) {
        const ptr0 = passStringToWasm0(keywords, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setKeywords(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Comment field of the document properties.
     *
     * Set the "Comment" field of the document properties. This can be a
     * general comment or summary that you want to add to the properties. See
     * the example above.
     *
     * @param {string} comment - The comment string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setComment(comment) {
        const ptr0 = passStringToWasm0(comment, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setComment(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the Status field of the document properties.
     *
     * Set the "Status" field of the document properties such as "Draft" or
     * "Final".
     *
     * @param {string} status - The status string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setStatus(status) {
        const ptr0 = passStringToWasm0(status, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setStatus(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
    /**
     * Set the hyperlink base field of the document properties.
     *
     * Set the "Hyperlink base" field of the document properties to have a
     * default base url.
     *
     * @param {string} hyperlink_base - The hyperlink base string property.
     * @returns {DocProperties} - The DocProperties object.
     */
    setHyperlinkBase(hyperlink_base) {
        const ptr0 = passStringToWasm0(hyperlink_base, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.docproperties_setHyperlinkBase(this.__wbg_ptr, ptr0, len0);
        return DocProperties.__wrap(ret);
    }
}

const ExcelDateTimeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_exceldatetime_free(ptr >>> 0, 1));

export class ExcelDateTime {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExcelDateTime.prototype);
        obj.__wbg_ptr = ptr;
        ExcelDateTimeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExcelDateTimeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_exceldatetime_free(ptr, 0);
    }
    /**
     * @param {string} s
     * @returns {ExcelDateTime}
     */
    static parseFromStr(s) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(s, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.exceldatetime_parseFromStr(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @returns {ExcelDateTime}
     */
    static fromYMD(year, month, day) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_fromYMD(retptr, year, month, day);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} hour
     * @param {number} min
     * @param {number} sec
     * @returns {ExcelDateTime}
     */
    static fromHMS(hour, min, sec) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_fromHMS(retptr, hour, min, sec);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} hour
     * @param {number} min
     * @param {number} sec
     * @param {number} milli
     * @returns {ExcelDateTime}
     */
    static fromHMSMilli(hour, min, sec, milli) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_fromHMSMilli(retptr, hour, min, sec, milli);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} hour
     * @param {number} min
     * @param {number} sec
     * @returns {ExcelDateTime}
     */
    andHMS(hour, min, sec) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_andHMS(retptr, this.__wbg_ptr, hour, min, sec);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} hour
     * @param {number} min
     * @param {number} sec
     * @param {number} milli
     * @returns {ExcelDateTime}
     */
    andHMSMilli(hour, min, sec, milli) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_andHMSMilli(retptr, this.__wbg_ptr, hour, min, sec, milli);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} number
     * @returns {ExcelDateTime}
     */
    static fromSerialDatetime(number) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_fromSerialDatetime(retptr, number);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {bigint} timestamp
     * @returns {ExcelDateTime}
     */
    static fromTimestamp(timestamp) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exceldatetime_fromTimestamp(retptr, timestamp);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return ExcelDateTime.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    toExcel() {
        const ret = wasm.exceldatetime_toExcel(this.__wbg_ptr);
        return ret;
    }
}

const FormatFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_format_free(ptr >>> 0, 1));
/**
 * The `Format` struct is used to define cell formatting for data in a
 * worksheet.
 *
 * The properties of a cell that can be formatted include: fonts, colors,
 * patterns, borders, alignment and number formatting.
 *
 * TODO: example omitted
 *
 * # Creating and using a Format object
 *
 * Formats are created by calling the {@link Format::constructor} method and properties as
 * set using the various methods shown is this section of the document. Once
 * the Format has been created it can be passed to one of the worksheet
 * `write*()` methods. Multiple properties can be set by chaining them
 * together:
 *
 * TODO: example omitted
 *
 * # Format methods and Format properties
 *
 * The following table shows the Excel format categories, in the order shown in
 * the Excel "Format Cell" dialog, and the equivalent `rust_xlsxwriter` Format
 * method:
 *
 * | Category        | Description           |  Method Name                             |
 * | :-------------- | :-------------------- |  :-------------------------------------- |
 * | **Number**      | Numeric format        |  {@link Format#setNumFormat}            |
 * | **Alignment**   | Horizontal align      |  {@link Format#setAlign}                 |
 * |                 | Vertical align        |  {@link Format#setAlign}                 |
 * |                 | Rotation              |  {@link Format#setRotation}              |
 * |                 | Text wrap             |  {@link Format#setTextWrap}             |
 * |                 | Indentation           |  {@link Format#setIndent}                |
 * |                 | Reading direction     |  {@link Format#setReadingDirection}     |
 * |                 | Shrink to fit         |  {@link Format#setShrink}                |
 * | **Font**        | Font type             |  {@link Format#setFontName}             |
 * |                 | Font size             |  {@link Format#setFontSize}             |
 * |                 | Font color            |  {@link Format#setFontColor}            |
 * |                 | Bold                  |  {@link Format#setBold}                  |
 * |                 | Italic                |  {@link Format#setItalic}                |
 * |                 | Underline             |  {@link Format#setUnderline}             |
 * |                 | Strikethrough         |  {@link Format#setFontStrikethrough}    |
 * |                 | Super/Subscript       |  {@link Format#setFontScript}           |
 * | **Border**      | Cell border           |  {@link Format#setBorder}                |
 * |                 | Bottom border         |  {@link Format#setBorderBottom}         |
 * |                 | Top border            |  {@link Format#setBorderTop}            |
 * |                 | Left border           |  {@link Format#setBorderLeft}           |
 * |                 | Right border          |  {@link Format#setBorderRight}          |
 * |                 | Border color          |  {@link Format#setBorderColor}          |
 * |                 | Bottom color          |  {@link Format#setBorderBottomColor}   |
 * |                 | Top color             |  {@link Format#setBorderTopColor}      |
 * |                 | Left color            |  {@link Format#setBorderLeftColor}     |
 * |                 | Right color           |  {@link Format#setBorderRightColor}    |
 * |                 | Diagonal border       |  {@link Format#setBorderDiagonal}       |
 * |                 | Diagonal border color |  {@link Format#setBorderDiagonalColor} |
 * |                 | Diagonal border type  |  {@link Format#setBorderDiagonalType}  |
 * | **Fill**        | Cell pattern          |  {@link Format#setPattern}               |
 * |                 | Background color      |  {@link Format#setBackgroundColor}      |
 * |                 | Foreground color      |  {@link Format#setForegroundColor}      |
 * | **Protection**  | Unlock cells          |  {@link Format#setUnlocked}              |
 * |                 | Hide formulas         |  {@link Format#setHidden}                |
 *
 * # Format Colors
 *
 * Format property colors are specified by using the {@link Color} enum with a Html
 * style RGB integer value or a limited number of defined colors:
 *
 * TODO: example omitted
 *
 * # Format Defaults
 *
 * The default Excel 365 cell format is a font setting of Calibri size 11 with
 * all other properties turned off.
 *
 * It is occasionally useful to use a default format with a method that
 * requires a format but where you don't actually want to change the
 * formatting.
 *
 * TODO: example omitted
 *
 * # Number Format Categories
 *
 * The {@link Format::setNumFormat} method is used to set the number format for
 * numbers used with
 * {@link Worksheet#writeNumberWithFormat}(crate::Worksheet::write_number_with_format()):
 *
 * TODO: example omitted
 *
 * If the number format you use is the same as one of Excel's built in number
 * formats then it will have a number category other than "General" or
 * "Number". The Excel number categories are:
 *
 * - General
 * - Number
 * - Currency
 * - Accounting
 * - Date
 * - Time
 * - Percentage
 * - Fraction
 * - Scientific
 * - Text
 * - Custom
 *
 * In the case of the example above the formatted output shows up as a Number
 * category:
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency1.png">
 *
 * If we wanted to have the number format display as a different category, such
 * as Currency, then would need to match the number format string used in the
 * code with the number format used by Excel. The easiest way to do this is to
 * open the Number Formatting dialog in Excel and set the required format:
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency2.png">
 *
 * Then, while still in the dialog, change to Custom. The format displayed is
 * the format used by Excel.
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency3.png">
 *
 * If we put the format that we found (`"[$$-409]#,##0.00"`) into our previous
 * example and rerun it we will get a number format in the Currency category:
 *
 * TODO: example omitted
 *
 * That give us the following updated output. Note that the number category is
 * now shown as Currency:
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency4.png">
 *
 * The same process can be used to find format strings for "Date" or
 * "Accountancy" formats.
 *
 * # Number Formats in different locales
 *
 * As shown in the previous section the `format.set_num_format()` method is
 * used to set the number format for `rust_xlsxwriter` formats. A common use
 * case is to set a number format with a "grouping/thousands" separator and a
 * "decimal" point:
 *
 * TODO: example omitted
 *
 * In the US locale (and some others) where the number "grouping/thousands"
 * separator is `","` and the "decimal" point is `"."` which would be shown in
 * Excel as:
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency5.png">
 *
 * In other locales these values may be reversed or different. They are
 * generally set in the "Region" settings of Windows or Mac OS.  Excel handles
 * this by storing the number format in the file format in the US locale, in
 * this case `#,##0.00`, but renders it according to the regional settings of
 * the host OS. For example, here is the same, unmodified, output file shown
 * above in a German locale:
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency6.png">
 *
 * And here is the same file in a Russian locale. Note the use of a space as
 * the "grouping/thousands" separator:
 *
 * <img src="https://rustxlsxwriter.github.io/images/format_currency7.png">
 *
 * In order to replicate Excel's behavior all `rust_xlsxwriter` programs should
 * use US locale formatting which will then be rendered in the settings of your
 * host OS.
 */
export class Format {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Format.prototype);
        obj.__wbg_ptr = ptr;
        FormatFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FormatFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_format_free(ptr, 0);
    }
    /**
     * Create a new Format object.
     *
     * Create a new Format object to use with worksheet formatting.
     */
    constructor() {
        const ret = wasm.format_new();
        this.__wbg_ptr = ret >>> 0;
        FormatFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Clone a Format object.
     * @returns {Format}
     */
    clone() {
        const ret = wasm.format_clone(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format alignment properties.
     *
     * This method is used to set the horizontal and vertical data alignment
     * within a cell.
     *
     * @param {FormatAlign} align - The vertical and or horizontal alignment direction as defined by the {@link FormatAlign} enum.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setAlign(align) {
        const ret = wasm.format_setAlign(this.__wbg_ptr, align);
        return Format.__wrap(ret);
    }
    /**
     * Set the bold property for a Format font.
     *
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setBold() {
        const ret = wasm.format_setBold(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the italic property for the Format font.
     *
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setItalic() {
        const ret = wasm.format_setItalic(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * @param {FormatUnderline} underline
     * @returns {Format}
     */
    setUnderline(underline) {
        const ret = wasm.format_setUnderline(this.__wbg_ptr, underline);
        return Format.__wrap(ret);
    }
    /**
     * @returns {Format}
     */
    setTextWrap() {
        const ret = wasm.format_setTextWrap(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * @param {number} level
     * @returns {Format}
     */
    setIndent(level) {
        const ret = wasm.format_setIndent(this.__wbg_ptr, level);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format rotation property.
     *
     * Set the rotation angle of the text in a cell. The rotation can be any
     * angle in the range -90 to 90 degrees, or 270 to indicate text where the
     * letters run from top to bottom.
     *
     * @param {number} rotation - The rotation angle.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setRotation(rotation) {
        const ret = wasm.format_setRotation(this.__wbg_ptr, rotation);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format border property.
     *
     * Set the cell border style. Individual border elements can be configured
     * using the following methods with the same parameters:
     *
     * - {@link Format#setBorderTop}
     * - {@link Format#setBorderLeft}
     * - {@link Format#setBorderRight}
     * - {@link Format#setBorderBottom}
     *
     * @param {FormatBorder} border - The border property as defined by a {@link FormatBorder} enum
     *   value.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setBorder(border) {
        const ret = wasm.format_setBorder(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format border color property.
     *
     * Set the cell border color. Individual border elements can be configured
     * using the following methods with the same parameters:
     *
     * - {@link Format#setBorderTopColor}
     * - {@link Format#setBorderLeftColor}
     * - {@link Format#setBorderRightColor}
     * - {@link Format#setBorderBottomColor}
     *
     * @param {Color} color - The border color as defined by a {@link Color}.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setBorderColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBorderColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell bottom border style.
     *
     * See {@link Format#setBorder} for details.
     *
     * @param {FormatBorder} border - The border property as defined by a {@link FormatBorder} enum
     *   value.
     * @return {Format} - The Format instance.
     */
    setBorderBottom(border) {
        const ret = wasm.format_setBorderBottom(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell bottom border color.
     *
     * See {@link Format#setBorderColor} for details.
     *
     * @param {Color} color - The border color as defined by a {@link Color}.
     * @return {Format} - The Format instance.
     */
    setBorderBottomColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBorderBottomColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell top border style.
     *
     * See {@link Format#setBorder} for details.
     *
     * @param {FormatBorder} border - The border property as defined by a {@link FormatBorder} enum
     *   value.
     * @return {Format} - The Format instance.
     */
    setBorderTop(border) {
        const ret = wasm.format_setBorderTop(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell top border color.
     *
     * See {@link Format#setBorderColor} for details.
     *
     * @param {Color} color - The border color as defined by a {@link Color}.
     * @return {Format} - The Format instance.
     */
    setBorderTopColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBorderTopColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell left border style.
     *
     * See {@link Format#setBorder} for details.
     *
     * @param {FormatBorder} border - The border property as defined by a {@link FormatBorder} enum
     *   value.
     * @return {Format} - The Format instance.
     */
    setBorderLeft(border) {
        const ret = wasm.format_setBorderLeft(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell left border color.
     *
     * See {@link Format#setBorderColor} for details.
     *
     * @param {Color} color - The border color as defined by a {@link Color}.
     * @return {Format} - The Format instance.
     */
    setBorderLeftColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBorderLeftColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell right border style.
     *
     * See {@link Format#setBorder} for details.
     *
     * @param {FormatBorder} border - The border property as defined by a {@link FormatBorder} enum
     *   value.
     * @return {Format} - The Format instance.
     */
    setBorderRight(border) {
        const ret = wasm.format_setBorderRight(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell right border color.
     *
     * See {@link Format#setBorderColor} for details.
     *
     * @param {Color} color - The border color as defined by a {@link Color}.
     * @return {Format} - The Format instance.
     */
    setBorderRightColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBorderRightColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format border diagonal property.
     *
     * Set the cell border diagonal line style. This method should be used in
     * conjunction with the {@link Format#setBorderDiagonalType} method to
     * set the diagonal type.
     *
     * @param {FormatBorder} border - The border property as defined by a {@link FormatBorder} enum
     *   value.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setBorderDiagonal(border) {
        const ret = wasm.format_setBorderDiagonal(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell diagonal border color.
     *
     * See {@link Format#setBorderDiagonal} for details.
     *
     * @param {Color} color - The border color as defined by a {@link Color}.
     * @return {Format} - The Format instance.
     */
    setBorderDiagonalColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBorderDiagonalColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the cell diagonal border direction type.
     *
     * See {@link Format#setBorderDiagonal} for details.
     *
     * @param {FormatDiagonalBorder}`border_type - The diagonal border type as defined by a {@link FormatDiagonalBorder} enum value.
     * @return {Format} - The Format instance.
     */
    setBorderDiagonalType(border) {
        const ret = wasm.format_setBorderDiagonalType(this.__wbg_ptr, border);
        return Format.__wrap(ret);
    }
    /**
     * Set the hyperlink style.
     *
     * Set the hyperlink style for use with urls. This is usually set
     * automatically when writing urls without a format applied.
     *
     * @return {Format} - The Format instance.
     */
    setHyperlink() {
        const ret = wasm.format_setHyperlink(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the color property for the Format font.
     *
     * The `setFontColor()` method is used to set the font color in a cell.
     * To set the color of a cell background use the `setBackgroundColor()` and
     * `setPattern()` methods.
     *
     * @param {Color} color - The font color property defined by a {@link Color} enum
     *   value.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setFontColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setFontColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font family property.
     *
     * Set the font family. This is usually an integer in the range 1-4. This
     * function is implemented for completeness but is rarely used in practice.
     *
     * @param {number} font_family - The font family property.
     * @return {Format} - The Format instance.
     */
    setFontFamily(font_family) {
        const ret = wasm.format_setFontFamily(this.__wbg_ptr, font_family);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font name property.
     *
     * Set the font for a cell format. Excel can only display fonts that are
     * installed on the system that it is running on. Therefore it is generally
     * best to use standard Excel fonts.
     *
     * @param {string} font_name - The font name property.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     * @param {string} font_name
     * @returns {Format}
     */
    setFontName(font_name) {
        const ptr0 = passStringToWasm0(font_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.format_setFontName(this.__wbg_ptr, ptr0, len0);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font size property.
     *
     * Set the font size of the cell format. The size is generally an integer
     * value but Excel allows x.5 values (hence the property is converted into a f64).
     *
     * Excel adjusts the height of a row to accommodate the largest font size
     * in the row.
     *
     * @param {number} font_size - The font size property.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setFontSize(font_size) {
        const ret = wasm.format_setFontSize(this.__wbg_ptr, font_size);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font scheme property.
     *
     * This function is implemented for completeness but is rarely used in
     * practice.
     *
     * @param {string} font_scheme - The font scheme property.
     * @return {Format} - The Format instance.
     */
    setFontScheme(font_scheme) {
        const ptr0 = passStringToWasm0(font_scheme, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.format_setFontScheme(this.__wbg_ptr, ptr0, len0);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font character set property.
     *
     * Set the font character. This function is implemented for completeness
     * but is rarely used in practice.
     *
     * @param {number} font_charset - The font character set property.
     * @return {Format} - The Format instance.
     */
    setFontCharset(font_charset) {
        const ret = wasm.format_setFontCharset(this.__wbg_ptr, font_charset);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font strikethrough property.
     *
     * TODO: example omitted
     * @returns {Format}
     */
    setFontStrikethrough() {
        const ret = wasm.format_setFontStrikethrough(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format font strikethrough property.
     *
     * @param {boolean} strikethrough - The strikethrough property.
     * @return {Format} - The Format instance.
     */
    setFormatScript(script) {
        const ret = wasm.format_setFormatScript(this.__wbg_ptr, script);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format pattern foreground color property.
     *
     * The `set_foreground_color` method can be used to set the
     * foreground/pattern color of a pattern. Patterns are defined via the
     * {@link Format#setPattern} method.
     *
     * @param {Color} color - The foreground color property defined by a {@link Color}.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setForegroundColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setForegroundColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format pattern background color property.
     *
     * The `setBackgroundColor` method can be used to set the background
     * color of a pattern. Patterns are defined via the {@link Format#setPattern}
     * method. If a pattern hasn't been defined then a solid fill pattern is
     * used as the default.
     *
     * @param {Color} color - The background color property defined by a {@link Color}.
     * @return {Format} - The Format instance.
     *
     * TODO: example omitted
     */
    setBackgroundColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.format_setBackgroundColor(this.__wbg_ptr, ptr0);
        return Format.__wrap(ret);
    }
    /**
     * Set the number format for a Format.
     *
     * This method is used to define the numerical format of a number in Excel.
     * It controls whether a number is displayed as an integer, a floating
     * point number, a date, a currency value or some other user defined
     * format.
     *
     * See also [Number Format Categories] and [Number Formats in different
     * locales].
     *
     * [Number Format Categories]: crate::Format#number-format-categories
     * [Number Formats in different locales]:
     *     crate::Format#number-formats-in-different-locales
     *
     * @param {string} num_format - The number format property.
     * @return {Format} - The Format instance.
     */
    setNumFormat(num_format) {
        const ptr0 = passStringToWasm0(num_format, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.format_setNumFormat(this.__wbg_ptr, ptr0, len0);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format pattern property.
     *
     * Set the pattern for a cell. The most commonly used pattern is
     * {@link FormatPattern#Solid}.
     *
     * To set the pattern colors see {@link Format#setBackgroundColor} and
     * {@link Format#setForegroundColor}
     *
     * TODO: example omitted
     *
     * @param {FormatPattern} pattern - The pattern property defined by a {@link FormatPattern} enum
     *   value.
     * @return {Format} - The Format instance.
     */
    setPattern(pattern) {
        const ret = wasm.format_setPattern(this.__wbg_ptr, pattern);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format property to hide formulas in a cell.
     *
     * This method can be used to hide a formula while still displaying its
     * result. This is generally used to hide complex calculations from end
     * users who are only interested in the result. It only has an effect if
     * the worksheet has been protected using the
     * {@link Worksheet#protect} method.
     *
     * TODO: example omitted
     *
     * @return {Format} - The Format instance.
     */
    setHidden() {
        const ret = wasm.format_setHidden(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the locked Format property back to its default "on" state.
     *
     * The opposite of {Format#setUnlocked}.
     *
     * @return {Format} - The Format instance.
     */
    setLocked() {
        const ret = wasm.format_setLocked(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the Format cell unlocked state.
     *
     * This method can be used to allow modification of a cell in a protected
     * worksheet. In Excel, cell locking is turned on by default for all cells.
     * However, it only has an effect if the worksheet has been protected using
     * the {@link Worksheet#protect} method.
     *
     * @return {Format} - The Format instance.
     */
    setUnlocked() {
        const ret = wasm.format_setUnlocked(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
    /**
     * Set the `quote_prefix` property for a Format.
     *
     * Set the quote prefix property of a format to ensure a string is treated
     * as a string after editing. This is the same as prefixing the string with
     * a single quote in Excel. You don't need to add the quote to the string
     * but you do need to add the format.
     *
     * @return {Format} - The Format instance.
     */
    setQuotePrefix() {
        const ret = wasm.format_setQuotePrefix(this.__wbg_ptr);
        return Format.__wrap(ret);
    }
}

const FormulaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_formula_free(ptr >>> 0, 1));

export class Formula {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Formula.prototype);
        obj.__wbg_ptr = ptr;
        FormulaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FormulaFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_formula_free(ptr, 0);
    }
    /**
     * @param {string} formula
     */
    constructor(formula) {
        const ptr0 = passStringToWasm0(formula, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.formula_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        FormulaFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} result
     * @returns {Formula}
     */
    setResult(result) {
        const ptr0 = passStringToWasm0(result, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.formula_setResult(this.__wbg_ptr, ptr0, len0);
        return Formula.__wrap(ret);
    }
}

const ImageFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_image_free(ptr >>> 0, 1));
/**
 * The `Image` struct is used to create an object to represent an image that
 * can be inserted into a worksheet.
 */
export class Image {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Image.prototype);
        obj.__wbg_ptr = ptr;
        ImageFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ImageFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_image_free(ptr, 0);
    }
    /**
     * Create an Image object from a u8 buffer. The image can then be inserted
     * into a worksheet.
     *
     * The supported image formats are:
     *
     * - PNG
     * - JPG
     * - GIF: The image can be an animated gif in more recent versions of
     *   Excel.
     * - BMP: BMP images are only supported for backward compatibility. In
     *   general it is best to avoid BMP images since they are not compressed.
     *   If used, BMP images must be 24 bit, true color, bitmaps.
     *
     * EMF and WMF file formats will be supported in an upcoming version of the
     * library.
     *
     * **NOTE on SVG files**: Excel doesn't directly support SVG files in the
     * same way as other image file formats. It allows SVG to be inserted into
     * a worksheet but converts them to, and displays them as, PNG files. It
     * stores the original SVG image in the file so the original format can be
     * retrieved. This removes the file size and resolution advantage of using
     * SVG files. As such SVG files are not supported by `rust_xlsxwriter`
     * since a conversion to the PNG format would be required and that format
     * is already supported.
     *
     * @param {array} buffer - The image data as a u8 array or vector.
     * @returns {Image} - The Image object.
     *
     * TODO: error
     * - [`XlsxError::UnknownImageType`] - Unknown image type. The supported
     *   image formats are PNG, JPG, GIF and BMP.
     * - [`XlsxError::ImageDimensionError`] - Image has 0 width or height, or
     *   the dimensions couldn't be read.
     */
    constructor(buffer) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(buffer, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.image_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            ImageFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Set the width scale for the image.
     *
     * Set the width scale for the image relative to 1.0 (i.e. 100%). See the
     * {@link Image#setScaleHeight} method for details.
     *
     * @param {number} scale - The scale ratio.
     * @returns {Image} - The Image object.
     */
    setScaleWidth(scale) {
        const ret = wasm.image_setScaleWidth(this.__wbg_ptr, scale);
        return Image.__wrap(ret);
    }
    /**
     * Set the width scale for the image.
     *
     * Set the width scale for the image relative to 1.0 (i.e. 100%). See the
     * {@link Image#setScaleHeight} method for details.
     *
     * @param {number} scale - The scale ratio.
     * @returns {Image} - The Image object.
     */
    setScaleHeight(scale) {
        const ret = wasm.image_setScaleHeight(this.__wbg_ptr, scale);
        return Image.__wrap(ret);
    }
    /**
     * Set the width of the image.
     *
     * Set the displayed width of the image in pixels. As with Excel this sets a logical size for the image,
     * it doesn't rescale the actual image. This allows the user to get back the original unscaled image.
     *
     * @param {number} width - The logical image width in pixels.
     * @returns {Image} - The Image object.
     */
    setWidth(width) {
        const ret = wasm.image_setWidth(this.__wbg_ptr, width);
        return Image.__wrap(ret);
    }
    /**
     * Set the height of the image.
     *
     * Set the displayed height of the image in pixels. As with Excel this sets a logical size for the image,
     * it doesn't rescale the actual image. This allows the user to get back the original unscaled image.
     *
     * @param {number} height - The logical image height in pixels.
     * @returns {Image} - The Image object.
     */
    setHeight(height) {
        const ret = wasm.image_setHeight(this.__wbg_ptr, height);
        return Image.__wrap(ret);
    }
    /**
     * Set the alternative text for the image.
     *
     * Set the alternative text for the image. This is used for accessibility and screen readers.
     *
     * @param {string} text - The alternative text for the image.
     * @returns {Image} - The Image object.
     */
    setAltText(text) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.image_setAltText(this.__wbg_ptr, ptr0, len0);
        return Image.__wrap(ret);
    }
    /**
     * Set the image as decorative.
     *
     * Set the image as decorative. This is used for accessibility and screen readers.
     * A decorative image is one that is used for visual purposes only and does not convey any meaning.
     *
     * @param {boolean} decorative - Whether the image is decorative.
     * @returns {Image} - The Image object.
     */
    setDecorative(decorative) {
        const ret = wasm.image_setDecorative(this.__wbg_ptr, decorative);
        return Image.__wrap(ret);
    }
    /**
     * Set the object movement options for a worksheet image.
     *
     * Set the option to define how an image will behave in Excel if the cells under the image are moved,
     * deleted, or have their size changed. In Excel the options are:
     *
     * 1. Move and size with cells.
     * 2. Move but don't size with cells.
     * 3. Don't move or size with cells.
     *
     * @param {ObjectMovement} movement - The object movement option.
     * @returns {Image} - The Image object.
     */
    setObjectMovement(movement) {
        const ret = wasm.image_setObjectMovement(this.__wbg_ptr, movement);
        return Image.__wrap(ret);
    }
    /**
     * Set the image to scale to a specific size.
     *
     * Set the image to scale to a specific size while maintaining the aspect ratio.
     *
     * @param {number} width - The target width in pixels.
     * @param {number} height - The target height in pixels.
     * @param {boolean} keep_aspect_ratio - Whether to maintain the aspect ratio.
     * @returns {Image} - The Image object.
     */
    setScaleToSize(width, height, keep_aspect_ratio) {
        const ret = wasm.image_setScaleToSize(this.__wbg_ptr, width, height, keep_aspect_ratio);
        return Image.__wrap(ret);
    }
}

const NoteFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_note_free(ptr >>> 0, 1));

export class Note {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Note.prototype);
        obj.__wbg_ptr = ptr;
        NoteFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NoteFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_note_free(ptr, 0);
    }
    /**
     * Create a new Note object to represent an Excel cell note.
     * The text of the Note is added in the constructor.
     * @param {string} text - The text that will appear in the note.
     * @returns {Note} - The note object.
     */
    constructor(text) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.note_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        NoteFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    setAuthor(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.note_setAuthor(this.__wbg_ptr, ptr0, len0);
        return Note.__wrap(ret);
    }
    addAuthorPrefix(enable) {
        const ret = wasm.note_addAuthorPrefix(this.__wbg_ptr, enable);
        return Note.__wrap(ret);
    }
    resetText(text) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.note_resetText(this.__wbg_ptr, ptr0, len0);
        return Note.__wrap(ret);
    }
    setWidth(width) {
        const ret = wasm.note_setWidth(this.__wbg_ptr, width);
        return Note.__wrap(ret);
    }
    setHeight(height) {
        const ret = wasm.note_setHeight(this.__wbg_ptr, height);
        return Note.__wrap(ret);
    }
    setVisible(enable) {
        const ret = wasm.note_setVisible(this.__wbg_ptr, enable);
        return Note.__wrap(ret);
    }
    setBackgroundColor(color) {
        _assertClass(color, Color);
        var ptr0 = color.__destroy_into_raw();
        const ret = wasm.note_setBackgroundColor(this.__wbg_ptr, ptr0);
        return Note.__wrap(ret);
    }
    setFontName(font_name) {
        const ptr0 = passStringToWasm0(font_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.note_setFontName(this.__wbg_ptr, ptr0, len0);
        return Note.__wrap(ret);
    }
    setFontSize(font_size) {
        const ret = wasm.note_setFontSize(this.__wbg_ptr, font_size);
        return Note.__wrap(ret);
    }
    setFontFamily(font_family) {
        const ret = wasm.note_setFontFamily(this.__wbg_ptr, font_family);
        return Note.__wrap(ret);
    }
    setFormat(format) {
        _assertClass(format, Format);
        var ptr0 = format.__destroy_into_raw();
        const ret = wasm.note_setFormat(this.__wbg_ptr, ptr0);
        return Note.__wrap(ret);
    }
    setAltText(alt_text) {
        const ptr0 = passStringToWasm0(alt_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.note_setAltText(this.__wbg_ptr, ptr0, len0);
        return Note.__wrap(ret);
    }
    setObjectMovement(option) {
        const ret = wasm.note_setObjectMovement(this.__wbg_ptr, option);
        return Note.__wrap(ret);
    }
}

const RichStringFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_richstring_free(ptr >>> 0, 1));
/**
 * A rich string is a string that can have multiple formats.
 */
export class RichString {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RichString.prototype);
        obj.__wbg_ptr = ptr;
        RichStringFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RichStringFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_richstring_free(ptr, 0);
    }
    /**
     * Create a new RichString struct.
     *
     * @returns {RichString} - The rich string object.
     */
    constructor() {
        const ret = wasm.richstring_new();
        this.__wbg_ptr = ret >>> 0;
        RichStringFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Add a new part to the rich string.
     * @param {Format} format
     * @param {string} string
     * @returns {RichString}
     */
    append(format, string) {
        _assertClass(format, Format);
        const ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.richstring_append(this.__wbg_ptr, format.__wbg_ptr, ptr0, len0);
        return RichString.__wrap(ret);
    }
}

const TableFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_table_free(ptr >>> 0, 1));
/**
 * The `Table` struct represents a worksheet Table.
 *
 * Tables in Excel are a way of grouping a range of cells into a single entity
 * that has common formatting or that can be referenced from formulas. Tables
 * can have column headers, autofilters, total rows, column formulas and
 * different formatting styles.
 *
 * The image below shows a default table in Excel with the default properties
 * shown in the ribbon bar.
 *
 * <img src="https://rustxlsxwriter.github.io/images/table_intro.png">
 *
 * A table is added to a worksheet via the
 * {@link Worksheet#addTable}(crate::Worksheet::add_table) method. The headers
 * and total row of a table should be configured via a `Table` struct but the
 * table data can be added via standard
 * {@link Worksheet#write}(crate::Worksheet::write) methods:
 *
 * TODO: example omitted
 *
 * For more information on tables see the Microsoft documentation on [Overview
 * of Excel tables].
 *
 * [Overview of Excel tables]:
 *     https://support.microsoft.com/en-us/office/overview-of-excel-tables-7ab0bb7d-3a9e-4b56-a3c9-6c94334e492c
 */
export class Table {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Table.prototype);
        obj.__wbg_ptr = ptr;
        TableFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TableFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_table_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.table_new();
        this.__wbg_ptr = ret >>> 0;
        TableFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} name
     * @returns {Table}
     */
    setName(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.table_setName(this.__wbg_ptr, ptr0, len0);
        return Table.__wrap(ret);
    }
    /**
     * @param {TableStyle} style
     * @returns {Table}
     */
    setStyle(style) {
        const ret = wasm.table_setStyle(this.__wbg_ptr, style);
        return Table.__wrap(ret);
    }
    /**
     * @param {TableColumn[]} columns
     * @returns {Table}
     */
    setColumns(columns) {
        const ptr0 = passArrayJsValueToWasm0(columns, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.table_setColumns(this.__wbg_ptr, ptr0, len0);
        return Table.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Table}
     */
    setFirstColumn(enable) {
        const ret = wasm.table_setFirstColumn(this.__wbg_ptr, enable);
        return Table.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Table}
     */
    setHeaderRow(enable) {
        const ret = wasm.table_setHeaderRow(this.__wbg_ptr, enable);
        return Table.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Table}
     */
    setTotalRow(enable) {
        const ret = wasm.table_setTotalRow(this.__wbg_ptr, enable);
        return Table.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Table}
     */
    setBandedColumns(enable) {
        const ret = wasm.table_setBandedColumns(this.__wbg_ptr, enable);
        return Table.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Table}
     */
    setBandedRows(enable) {
        const ret = wasm.table_setBandedRows(this.__wbg_ptr, enable);
        return Table.__wrap(ret);
    }
}

const TableColumnFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tablecolumn_free(ptr >>> 0, 1));
/**
 * The `TableColumn` struct represents a table column.
 *
 * The `TableColumn` struct is used to set the properties for columns in a
 * worksheet {@link Table}. This can be used to set the following properties of a
 * table column:
 *
 * - The header caption.
 * - The total row caption.
 * - The total row subtotal function.
 * - A formula for the column.
 *
 * This struct is used in conjunction with the {@link Table#setColumns} method.
 */
export class TableColumn {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TableColumn.prototype);
        obj.__wbg_ptr = ptr;
        TableColumnFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof TableColumn)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TableColumnFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tablecolumn_free(ptr, 0);
    }
    /**
     * Create a new `TableColumn` to configure a Table column.
     */
    constructor() {
        const ret = wasm.tablecolumn_new();
        this.__wbg_ptr = ret >>> 0;
        TableColumnFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the header caption for a table column.
     *
     * Excel uses default captions such as `Column 1`, `Column 2`, etc., for
     * the headers on a worksheet table. These can be set to a user defined
     * value using the `setHeader()` method.
     *
     * The column header names in a table must be different from each other.
     * Non-unique names will raise a validation error when using
     * {@link Worksheet#addTable}.
     *
     * @param {string} caption - The caption/name of the column header. It must be unique for the table.
     * @returns {TableColumn} - The TableColumn object.
     */
    setHeader(caption) {
        const ptr0 = passStringToWasm0(caption, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tablecolumn_setHeader(this.__wbg_ptr, ptr0, len0);
        return TableColumn.__wrap(ret);
    }
    /**
     * Set the format for the header of the table column.
     *
     * The `setHeaderFormat` method can be used to set the format for the
     * column header in a worksheet table.
     *
     * @param {Format} format - The {@link Format} property for the column header.
     * @returns {TableColumn} - The TableColumn object.
     */
    setHeaderFormat(format) {
        _assertClass(format, Format);
        const ret = wasm.tablecolumn_setHeaderFormat(this.__wbg_ptr, format.__wbg_ptr);
        return TableColumn.__wrap(ret);
    }
    /**
     * Set the format for a table column.
     *
     * It is sometimes required to format the data in the columns of a table.
     * This can be done using the standard
     * {@link Worksheet#writeWithFormat} method
     * but format can also be applied separately using
     * `TableColumn.setFormat()`.
     *
     * The most common format property to set for a table column is the number
     * format({@link Format#setNumFormat}), see the example below.
     * TODO: example omitted
     *
     * @param {Format} format - The {@link Format} property for the column header.
     * @returns {TableColumn} - The TableColumn object.
     */
    setFormat(format) {
        _assertClass(format, Format);
        const ret = wasm.tablecolumn_setFormat(this.__wbg_ptr, format.__wbg_ptr);
        return TableColumn.__wrap(ret);
    }
    /**
     * Set the formula for a table column.
     *
     * It is a common use case to add a summation column as the last column in a
     * table. These are constructed with a special class of Excel formulas
     * called [Structured References] which can refer to an entire table or
     * rows or columns of data within the table. For example to sum the data
     * for several columns in a single row might you might use a formula like
     * this: `SUM(Table1[@[Quarter 1]:[Quarter 4]])`.
     *
     * [Structured References]:
     *     https://support.microsoft.com/en-us/office/using-structured-references-with-excel-tables-f5ed2452-2337-4f71-bed3-c8ae6d2b276e
     *
     * @param {Formula} formula - The formula to be applied to the column.
     * @returns {TableColumn} - The TableColumn object.
     */
    setFormula(formula) {
        _assertClass(formula, Formula);
        const ret = wasm.tablecolumn_setFormula(this.__wbg_ptr, formula.__wbg_ptr);
        return TableColumn.__wrap(ret);
    }
    /**
     * Set a label for the total row of a table column.
     *
     * It is possible to set a label for the totals row of a column instead of
     * a subtotal function. This is most often used to set a caption like
     * "Totals", as in the example above.
     *
     * Note, overwriting the total row cells with `worksheet.write()` calls
     * will cause Excel to warn that the table is corrupt when loading the
     * file.
     *
     * @param {string} label - The label/caption of the total row of the column.
     * @returns {TableColumn} - The TableColumn object.
     */
    setTotalLabel(label) {
        const ptr0 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tablecolumn_setTotalLabel(this.__wbg_ptr, ptr0, len0);
        return TableColumn.__wrap(ret);
    }
    /**
     * Set the total function for the total row of a table column.
     *
     * Set the `SUBTOTAL()` function for the "totals" row of a table column.
     *
     * The standard Excel subtotal functions are available via the
     * {@link TableFunction} enum values. The Excel functions are:
     *
     * - Average
     * - Count
     * - Count Numbers
     * - Maximum
     * - Minimum
     * - Sum
     * - Standard Deviation
     * - Variance
     * - Custom - User defined function or formula
     *
     * Note, overwriting the total row cells with `worksheet.write()` calls
     * will cause Excel to warn that the table is corrupt when loading the
     * file.
     *
     * @param {TableFunction} table_function - A {@link TableFunction} enum value equivalent to one of the
     *   available Excel `SUBTOTAL()` options.
     * @returns {TableColumn} - The TableColumn object.
     */
    setTotalFunction(table_function) {
        _assertClass(table_function, TableFunction);
        const ret = wasm.tablecolumn_setTotalFunction(this.__wbg_ptr, table_function.__wbg_ptr);
        return TableColumn.__wrap(ret);
    }
}

const TableFunctionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tablefunction_free(ptr >>> 0, 1));
/**
 * The `TableFunction` enum defines functions for worksheet table total rows.
 *
 * The `TableFunction` enum contains definitions for the standard Excel
 * "SUBTOTAL" functions that are available via the dropdown in the total row of
 * an Excel table. It also supports custom user defined functions or formulas.
 *
 * TODO: example omitted
 */
export class TableFunction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TableFunction.prototype);
        obj.__wbg_ptr = ptr;
        TableFunctionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TableFunctionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tablefunction_free(ptr, 0);
    }
    /**
     * Use the average function as the table total.
     * @returns {TableFunction}
     */
    static average() {
        const ret = wasm.tablefunction_average();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the count function as the table total.
     * @returns {TableFunction}
     */
    static count() {
        const ret = wasm.tablefunction_count();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the count numbers function as the table total.
     * @returns {TableFunction}
     */
    static countNumbers() {
        const ret = wasm.tablefunction_countNumbers();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the max function as the table total.
     * @returns {TableFunction}
     */
    static max() {
        const ret = wasm.tablefunction_max();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the min function as the table total.
     * @returns {TableFunction}
     */
    static min() {
        const ret = wasm.tablefunction_min();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the sum function as the table total.
     * @returns {TableFunction}
     */
    static sum() {
        const ret = wasm.tablefunction_sum();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the standard deviation function as the table total.
     * @returns {TableFunction}
     */
    static stdDev() {
        const ret = wasm.tablefunction_stdDev();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use the var function as the table total.
     * @returns {TableFunction}
     */
    static var() {
        const ret = wasm.tablefunction_var();
        return TableFunction.__wrap(ret);
    }
    /**
     * Use a custom/user specified function or formula.
     * @param {Formula} formula
     * @returns {TableFunction}
     */
    static custom(formula) {
        _assertClass(formula, Formula);
        const ret = wasm.tablefunction_custom(formula.__wbg_ptr);
        return TableFunction.__wrap(ret);
    }
}

const UrlFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_url_free(ptr >>> 0, 1));
/**
 * The `Url` struct is used to define a worksheet url.
 *
 * The `Url` struct creates a url type that can be used to write worksheet
 * urls.
 *
 * In general you would use the
 * {@link Worksheet#writeUrl} with a string
 * representation of the url, like this:
 *
 * TODO: example omitted
 *
 * The url will then be displayed as expected in Excel:
 *
 * <img src="https://rustxlsxwriter.github.io/images/url_intro1.png">
 *
 * In order to differentiate a url from an ordinary string (for example when
 * storing it in a data structure) you can also represent the url with a
 * {@link Url} struct:
 *
 * TODO: example omitted
 *
 * Using a `Url` struct also allows you to write a url using the generic
 * {@link Worksheet#write} method:
 *
 * TODO: example omitted
 *
 * There are 3 types of url/link supported by Excel and the `rust_xlsxwriter`
 * library:
 *
 * 1. Web based URIs like:
 *
 *    * `http://`, `https://`, `ftp://`, `ftps://` and `mailto:`.
 *
 * 2. Local file links using the `file://` URI.
 *
 *    * `file:///Book2.xlsx`
 *    * `file:///..\Sales\Book2.xlsx`
 *    * `file:///C:\Temp\Book1.xlsx`
 *    * `file:///Book2.xlsx#Sheet1!A1`
 *    * `file:///Book2.xlsx#'Sales Data'!A1:G5`
 *
 *    Most paths will be relative to the root folder, following the Windows
 *    convention, so most paths should start with `file:///`. For links to
 *    other Excel files the url string can include a sheet and cell reference
 *    after the `"#"` anchor, as shown in the last 2 examples above. When using
 *    Windows paths, like in the examples above, it is best to use a Rust raw
 *    string to avoid issues with the backslashes:
 *    `r"file:///C:\Temp\Book1.xlsx"`.
 *
 * 3. Internal links to a cell or range of cells in the workbook using the
 *    pseudo-uri `internal:`:
 *
 *    * `internal:Sheet2!A1`
 *    * `internal:Sheet2!A1:G5`
 *    * `internal:'Sales Data'!A1`
 *
 *    Worksheet references are typically of the form `Sheet1!A1` where a
 *    worksheet and target cell should be specified. You can also link to a
 *    worksheet range using the standard Excel range notation like
 *    `Sheet1!A1:B2`. Excel requires that worksheet names containing spaces or
 *    non alphanumeric characters are single quoted as follows `'Sales
 *    Data'!A1`.
 *
 * The library will escape the following characters in URLs as required by
 * Excel, ``\s " < > \ [ ] ` ^ { }``, unless the URL already contains `%xx`
 * style escapes. In which case it is assumed that the URL was escaped
 * correctly by the user and will by passed directly to Excel.
 *
 * Excel has a limit of around 2080 characters in the url string. Urls beyond
 * this limit will raise an error when written.
 */
export class Url {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Url.prototype);
        obj.__wbg_ptr = ptr;
        UrlFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UrlFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_url_free(ptr, 0);
    }
    /**
     * Create a new Url struct.
     *
     * @param {string} link - A string like type representing a URL.
     * @returns {Url} - The url object.
     */
    constructor(link) {
        const ptr0 = passStringToWasm0(link, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.url_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        UrlFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the alternative text for the url.
     *
     * Set an alternative, user friendly, text for the url.
     *
     * @param {string} text - The alternative text, as a string or string like type.
     * @returns {Url} - The url object.
     */
    setText(text) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.url_setText(this.__wbg_ptr, ptr0, len0);
        return Url.__wrap(ret);
    }
    /**
     * Set the screen tip for the url.
     *
     * Set a screen tip when the user does a mouseover of the url.
     *
     * @param {string} tip - The url tip, as a string or string like type.
     * @returns {Url} - The url object.
     */
    setTip(tip) {
        const ptr0 = passStringToWasm0(tip, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.url_setTip(this.__wbg_ptr, ptr0, len0);
        return Url.__wrap(ret);
    }
}

const WorkbookFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_workbook_free(ptr >>> 0, 1));
/**
 * The `Workbook` struct represents an Excel file in its entirety. It is the
 * starting point for creating a new Excel xlsx file.
 */
export class Workbook {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WorkbookFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_workbook_free(ptr, 0);
    }
    /**
     * Create a new Workbook object to represent an Excel spreadsheet file.
     *
     * This constructor is used to create a new Excel workbook
     * object. This is used to create worksheets and add data prior to saving
     * everything to an xlsx file with {@link Workbook#saveToBufferSync}.
     *
     * **Note**: `rust_xlsxwriter` can only create new files. It cannot read or
     * modify existing files.
     *
     * TODO: example omitted
     */
    constructor() {
        const ret = wasm.workbook_new();
        this.__wbg_ptr = ret >>> 0;
        WorkbookFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Add a new worksheet to a workbook.
     *
     * The `addWorksheet()` method adds a new {{@link Worksheet} to a
     * workbook.
     *
     * The worksheets will be given standard Excel name like `Sheet1`,
     * `Sheet2`, etc. Alternatively, the name can be set using
     * `worksheet.setName()`, see the example below and the docs for
     * {@link Worksheet#setName}.
     *
     * The `addWorksheet()` method returns a borrowed mutable reference to a
     * Worksheet instance owned by the Workbook so only one worksheet can be in
     * existence at a time, see the example below. This limitation can be
     * avoided, if necessary, by creating standalone Worksheet objects via
     * {@link Worksheet::constructor} and then later adding them to the workbook with
     * {@link Workbook#pushWorksheet}.
     *
     * See also the documentation on [Creating worksheets] and working with the
     * borrow checker.
     *
     * [Creating worksheets]: ../worksheet/index.html#creating-worksheets
     *
     * @returns {Worksheet} - The worksheet object.
     *
     * TODO: example omitted
     */
    addWorksheet() {
        const ret = wasm.workbook_addWorksheet(this.__wbg_ptr);
        return Worksheet.__wrap(ret);
    }
    /**
     * Get a worksheet reference by index.
     *
     * Get a reference to a worksheet created via {@link Workbook#addWorksheet}
     * using an index based on the creation order.
     *
     * Due to borrow checking rules you can only have one active reference to a
     * worksheet object created by `add_worksheet()` since that method always
     * returns a mutable reference. For a workbook with multiple worksheets
     * this restriction is generally workable if you can create and use the
     * worksheets sequentially since you will only need to have one reference
     * at any one time. However, if you can't structure your code to work
     * sequentially then you get a reference to a previously created worksheet
     * using `worksheetFromIndex()`. The standard borrow checking rules still
     * apply so you will have to give up ownership of any other worksheet
     * reference prior to calling this method. See the example below.
     *
     * See also {@link Workbook#worksheetFromName} and the documentation on
     * [Creating worksheets] and working with the borrow checker.
     *
     * [Creating worksheets]: ../worksheet/index.html#creating-worksheets
     *
     * @param {number} index - The index of the worksheet to get a reference to.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::UnknownWorksheetNameOrIndex`] - Error when trying to
     *   retrieve a worksheet reference by index. This is usually an index out
     *   of bounds error.
     *
     * TODO: example omitted
     */
    worksheetFromIndex(index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.workbook_worksheetFromIndex(retptr, this.__wbg_ptr, index);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get a worksheet reference by name.
     *
     * Get a reference to a worksheet created via {@link Workbook#addWorksheet}
     * using the sheet name.
     *
     * Due to borrow checking rules you can only have one active reference to a
     * worksheet object created by `add_worksheet()` since that method always
     * returns a mutable reference. For a workbook with multiple worksheets
     * this restriction is generally workable if you can create and use the
     * worksheets sequentially since you will only need to have one reference
     * at any one time. However, if you can't structure your code to work
     * sequentially then you get a reference to a previously created worksheet
     * using `worksheetFromName()`. The standard borrow checking rules still
     * apply so you will have to give up ownership of any other worksheet
     * reference prior to calling this method. See the example below.
     *
     * Worksheet names are usually "Sheet1", "Sheet2", etc., or else a user
     * define name that was set using {@link Worksheet#setName}. You can also
     * use the {@link Worksheet#name} method to get the name.
     *
     * See also {@link Workbook#worksheetFromIndex} and the documentation on
     * [Creating worksheets] and working with the borrow checker.
     *
     * [Creating worksheets]: ../worksheet/index.html#creating-worksheets
     *
     * @param {string} name - The name of the worksheet to get a reference to.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::UnknownWorksheetNameOrIndex`] - Error when trying to
     *   retrieve a worksheet reference by index. This is usually an index out
     *   of bounds error.
     *
     * TODO: example omitted
     */
    worksheetFromName(name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.workbook_worksheetFromName(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create a defined name in the workbook to use as a variable.
     *
     * The `defineName()` method is used to defined a variable name that can
     * be used to represent a value, a single cell or a range of cells in a
     * workbook. These are sometimes referred to as a "Named Ranges".
     *
     * Defined names are generally used to simplify or clarify formulas by
     * using descriptive variable names. For example:
     *
     * ```text
     *     // Global workbook name.
     *     workbook.define_name("Exchange_rate", "=0.96")?;
     *     worksheet.write_formula(0, 0, "=Exchange_rate")?;
     * ```
     *
     * A name defined like this is "global" to the workbook and can be used in
     * any worksheet in the workbook.  It is also possible to define a
     * local/worksheet name by prefixing it with the sheet name using the
     * syntax `"sheetname!defined_name"`:
     *
     * ```text
     *     // Local worksheet name.
     *     workbook.define_name('Sheet2!Sales', '=Sheet2!$G$1:$G$10')?;
     * ```
     *
     * See the full example below.
     *
     * Note, Excel has limitations on names used in defined names. For example
     * it must start with a letter or underscore and cannot contain a space or
     * any of the characters: `,/*[]:\"'`. It also cannot look like an Excel
     * range such as `A1`, `XFD12345` or `R1C1`. If in doubt it best to test
     * the name in Excel first.
     *
     * For local defined names sheet name must exist (at the time of saving)
     * and if the sheet name contains spaces or special characters you must
     * follow the Excel convention and enclose it in single quotes:
     *
     * ```text
     *     workbook.define_name("'New Data'!Sales", ""=Sheet2!$G$1:$G$10")?;
     * ```
     *
     * The rules for names in Excel are explained in the Microsoft Office
     * documentation on how to [Define and use names in
     * formulas](https://support.microsoft.com/en-us/office/define-and-use-names-in-formulas-4d0f13ac-53b7-422e-afd2-abd7ff379c64)
     * and subsections.
     *
     * @param {string} name - The variable name to define.
     * @param {string} formula - The formula, value or range that the name defines..
     *
     * # Errors
     *
     * - [`XlsxError::ParameterError`] - The following Excel error cases will
     *   raise a `ParameterError` error:
     *   * If the name doesn't start with a letter or underscore.
     *   * If the name contains `,/*[]:\"'` or `space`.
     *
     * TODO: example omitted
     */
    defineName(name, formula) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(formula, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            wasm.workbook_defineName(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Save the Workbook as an xlsx file and return it as a byte vector.
     *
     * The workbook `saveToBufferSync()` returns the xlsx file as a
     * `Vec<u8>` buffer suitable for streaming in a web application.
     *
     * # Errors
     *
     * - [`XlsxError::SheetnameReused`] - Worksheet name is already in use in
     *   the workbook.
     * - [`XlsxError::IoError`] - A wrapper for various IO errors when creating
     *   the xlsx file, or its sub-files.
     * - [`XlsxError::ZipError`] - A wrapper for various zip errors when
     *   creating the xlsx file, or its sub-files.
     *
     * TODO: example omitted
     * @returns {Uint8Array}
     */
    saveToBufferSync() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.workbook_saveToBufferSync(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add a recommendation to open the file in “read-only” mode.
     *
     * This method can be used to set the Excel “Read-only Recommended” option
     * that is available when saving a file. This presents the user of the file
     * with an option to open it in "read-only" mode. This means that any
     * changes to the file can’t be saved back to the same file and must be
     * saved to a new file.
     *
     * TODO: example omitted
     */
    readOnlyRecommended() {
        wasm.workbook_readOnlyRecommended(this.__wbg_ptr);
    }
    /**
     * Set the Excel document metadata properties.
     *
     * Set various Excel document metadata properties such as Author or
     * Creation Date. It is used in conjunction with the {@link DocProperties}
     * struct.
     *
     * @param {DocProperties} properties - A reference to a {@link DocProperties} object.
     */
    setProperties(properties) {
        _assertClass(properties, DocProperties);
        wasm.workbook_setProperties(this.__wbg_ptr, properties.__wbg_ptr);
    }
}

const WorksheetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_worksheet_free(ptr >>> 0, 1));
/**
 * The `Worksheet` struct represents an Excel worksheet. It handles operations
 * such as writing data to cells or formatting the worksheet layout.
 *
 * TODO: example omitted
 */
export class Worksheet {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Worksheet.prototype);
        obj.__wbg_ptr = ptr;
        WorksheetFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WorksheetFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_worksheet_free(ptr, 0);
    }
    /**
     * Get the worksheet name.
     *
     * Get the worksheet name that was set automatically such as Sheet1,
     * Sheet2, etc., or that was set by the user using
     * {@link Worksheet#setName}.
     *
     * The worksheet name can be used to get a reference to a worksheet object
     * using the {@link Workbook#worksheetFromName} method.
     *
     * TODO: example omitted
     * @returns {string}
     */
    name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_name(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Set the worksheet name.
     *
     * Set the worksheet name. If no name is set the default Excel convention
     * will be followed (Sheet1, Sheet2, etc.) in the order the worksheets are
     * created.
     *
     * @param {string} name - The worksheet name. It must follow the Excel rules, shown
     *   below.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::SheetnameCannotBeBlank`] - Worksheet name cannot be
     *   blank.
     * - [`XlsxError::SheetnameLengthExceeded`] - Worksheet name exceeds
     *   Excel's limit of 31 characters.
     * - [`XlsxError::SheetnameContainsInvalidCharacter`] - Worksheet name
     *   cannot contain invalid characters: `[ ] : * ? / \`
     * - [`XlsxError::SheetnameStartsOrEndsWithApostrophe`] - Worksheet name
     *   cannot start or end with an apostrophe.
     *
     * TODO: example omitted
     *
     * The worksheet name must be a valid Excel worksheet name, i.e:
     *
     * - The name is less than 32 characters.
     * - The name isn't blank.
     * - The name doesn't contain any of the characters: `[ ] : * ? / \`.
     * - The name doesn't start or end with an apostrophe.
     * - The name shouldn't be "History" (case-insensitive) since that is
     *   reserved by Excel.
     * - It must not be a duplicate of another worksheet name used in the
     *   workbook.
     *
     * The rules for worksheet names in Excel are explained in the [Microsoft
     * Office documentation].
     *
     * [Microsoft Office documentation]:
     *     https://support.office.com/en-ie/article/rename-a-worksheet-3f1f7148-ee83-404d-8ef0-9ff99fbad1f9
     */
    setName(name) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.worksheet_setName(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Freeze panes in a worksheet.
     *
     * The `set_freeze_panes()` method can be used to divide a worksheet into
     * horizontal or vertical regions known as panes and to "freeze" these
     * panes so that the splitter bars are not visible.
     *
     * As with Excel the split is to the top and left of the cell. So to freeze
     * the top row and leftmost column you would use `(1, 1)` (zero-indexed).
     * Also, you can set one of the row and col parameters as 0 if you do not
     * want either the vertical or horizontal split. See the example below.
     *
     * In Excel it is also possible to set "split" panes without freezing them.
     * That feature isn't currently supported by `rust_xlsxwriter`.
     *
     * # Parameters
     *
     * - `row`: The zero indexed row number.
     * - `col`: The zero indexed column number.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     */
    setFreezePanes(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setFreezePanes(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Set the top most cell in the scrolling area of a freeze pane.
     *
     * This method is used in conjunction with the
     * [`Worksheet::set_freeze_panes()`] method to set the top most visible
     * cell in the scrolling range. For example you may want to freeze the top
     * row but have the worksheet pre-scrolled so that cell `A20` is visible in
     * the scrolled area. See the example below.
     *
     * # Parameters
     *
     * - `row`: The zero indexed row number.
     * - `col`: The zero indexed column number.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     */
    setFreezePanesTopCell(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setFreezePanesTopCell(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    setHeader(header) {
        const ptr0 = passStringToWasm0(header, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.worksheet_setHeader(this.__wbg_ptr, ptr0, len0);
        return Worksheet.__wrap(ret);
    }
    setHeaderImage(image, position) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            wasm.worksheet_setHeaderImage(retptr, this.__wbg_ptr, image.__wbg_ptr, position);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    setFooter(footer) {
        const ptr0 = passStringToWasm0(footer, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.worksheet_setFooter(this.__wbg_ptr, ptr0, len0);
        return Worksheet.__wrap(ret);
    }
    setFooterImage(image, position) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            wasm.worksheet_setFooterImage(retptr, this.__wbg_ptr, image.__wbg_ptr, position);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Make a worksheet the active/initially visible worksheet in a workbook.
     *
     * The `set_active()` method is used to specify which worksheet is
     * initially visible in a multi-sheet workbook. If no worksheet is set then
     * the first worksheet is made the active worksheet, like in Excel.
     *
     * @param {boolean} enable - Turn the property on/off. It is off by default.
     * @returns {Worksheet} - The worksheet object.
     *
     * TODO: example omitted
     */
    setActive(enable) {
        const ret = wasm.worksheet_setActive(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * Set the width for a worksheet column.
     *
     * The `setColumnWidth()` method is used to change the default width of a
     * worksheet column.
     *
     * The ``width`` parameter sets the column width in the same units used by
     * Excel which is: the number of characters in the default font. The
     * default width is 8.43 in the default font of Calibri 11. The actual
     * relationship between a string width and a column width in Excel is
     * complex. See the [following explanation of column
     * widths](https://support.microsoft.com/en-us/kb/214123) from the
     * Microsoft support documentation for more details. To set the width in
     * pixels use the {@link Worksheet#setColumnWidthPixels} method.
     *
     * See also the {@link Worksheet#autofit} method.
     *
     * @param {number} col - The zero indexed column number.
     * @param {number} width - The column width in character units.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Column exceeds Excel's worksheet
     *   limits.
     *
     * TODO: example omitted
     */
    setColumnWidth(col, width) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setColumnWidth(retptr, this.__wbg_ptr, col, width);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Set the width for a worksheet column in pixels.
     *
     * The `setColumnWidthPixels()` method is used to change the default
     * width in pixels of a worksheet column.
     *
     * To set the width in Excel character units use the
     * {Worksheet#setColumnWidth} method.
     *
     * See also the {@link Worksheet#autofit} method.
     *
     * @param {number} col - The zero indexed column number.
     * @param {number} width - The column width in pixels.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Column exceeds Excel's worksheet
     *   limits.
     *
     * TODO: example omitted
     */
    setColumnWidthPixels(col, width) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setColumnWidthPixels(retptr, this.__wbg_ptr, col, width);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Set the width for a range of columns.
     *
     * This is a syntactic shortcut for setting the width for a range of
     * contiguous cells. See {@link Worksheet#setColumnWidth} for more
     * details on the single column version.
     *
     * @param {number} first_col - The first row of the range. Zero indexed.
     * @param {number} last_col - The last row of the range.
     * @param {number} width - The column width in character units.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Column exceeds Excel's worksheet
     *   limits.
     * - [`XlsxError::RowColumnOrderError`] - First column larger than the last
     *   column.
     */
    setColumnRangeWidth(first_col, last_col, width) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setColumnRangeWidth(retptr, this.__wbg_ptr, first_col, last_col, width);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write generic data to a cell.
     *
     * The `write()` method writes data of type {@link ExcelData} to a worksheet.
     *
     * The types currently supported are:
     * - {number}
     * - {string}
     * - {boolean}
     * - {null}
     * - {Date}
     * - {@link Formula}
     * - {@link Url}
     *
     * TODO: support bigint
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {ExcelData} data - Data to write.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     * - [`XlsxError::MaxStringLengthExceeded`] - String exceeds Excel's limit
     *   of 32,767 characters.
     */
    write(row, col, data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_write(retptr, this.__wbg_ptr, row, col, addBorrowedObject(data));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Write formatted generic data to a cell.
     *
     * The `writeWithFormat()` method writes data of type {@link ExcelData} to a worksheet.
     *
     * See {@link Worksheet#write} for a list of supported data types.
     * See {@link Format} for a list of supported formatting options.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {ExcelData} data - Data to write.
     * @param {Format} format - The {@link Format} property for the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     * - [`XlsxError::MaxStringLengthExceeded`] - String exceeds Excel's limit
     *   of 32,767 characters.
     */
    writeWithFormat(row, col, data, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeWithFormat(retptr, this.__wbg_ptr, row, col, addBorrowedObject(data), format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Write a blank formatted worksheet cell.
     *
     * Write a blank cell with formatting to a worksheet cell. The format is
     * set via a {@link Format} struct.
     *
     * Excel differentiates between an "Empty" cell and a "Blank" cell. An
     * "Empty" cell is a cell which doesn't contain data or formatting whilst a
     * "Blank" cell doesn't contain data but does contain formatting. Excel
     * stores "Blank" cells but ignores "Empty" cells.
     *
     * The most common case for a formatted blank cell is to write a background
     * or a border, see the example below.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Format} format - The {@link Format} property for the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    writeBlank(row, col, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeBlank(retptr, this.__wbg_ptr, row, col, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write an unformatted string to a worksheet cell.
     *
     * Write an unformatted string to a worksheet cell. To write a formatted
     * string see the {@link Worksheet#writeStringWithFormat} method below.
     *
     * Excel only supports UTF-8 text in the xlsx file format. Any Rust UTF-8
     * encoded string can be written with this method. The maximum string size
     * supported by Excel is 32,767 characters.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {string} string - The string to write to the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     * - [`XlsxError::MaxStringLengthExceeded`] - String exceeds Excel's limit
     *   of 32,767 characters.
     *
     * TODO: example omitted
     */
    writeString(row, col, string) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.worksheet_writeString(retptr, this.__wbg_ptr, row, col, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write a formatted string to a worksheet cell.
     *
     * Write a string with formatting to a worksheet cell. The format is set
     * via a {@link Format} struct which can control the font or color or
     * properties such as bold and italic.
     *
     * Excel only supports UTF-8 text in the xlsx file format. Any Rust UTF-8
     * encoded string can be written with this method. The maximum string
     * size supported by Excel is 32,767 characters.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {string} string - The string to write to the cell.
     * @param {Format} format - The {@link Format} property for the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     * - [`XlsxError::MaxStringLengthExceeded`] - String exceeds Excel's limit
     *   of 32,767 characters.
     *
     * TODO: example omitted
     */
    writeStringWithFormat(row, col, string, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            _assertClass(format, Format);
            wasm.worksheet_writeStringWithFormat(retptr, this.__wbg_ptr, row, col, ptr0, len0, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write an unformatted number to a cell.
     *
     * Write an unformatted number to a worksheet cell. To write a formatted
     * number see the {@link Worksheet#writeNumberWithFormat} method below.
     *
     * TODO: improve docs
     * All numerical values in Excel are stored as [IEEE 754] Doubles which are
     * the equivalent of rust's [`f64`] type. This method will accept any rust
     * type that will convert [`Into`] a f64. These include i8, u8, i16, u16,
     * i32, u32 and f32 but not i64 or u64, see below.
     *
     * IEEE 754 Doubles and f64 have around 15 digits of precision. Anything
     * beyond that cannot be stored as a number by Excel without a loss of
     * precision and may need to be stored as a string instead.
     *
     * [IEEE 754]: https://en.wikipedia.org/wiki/IEEE_754
     *
     * For i64/u64 you can cast the numbers `as f64` which will allow you to
     * store the number with a loss of precision outside Excel's integer range
     * of +/- 999,999,999,999,999 (15 digits).
     *
     * Excel doesn't have handling for NaN or INF floating point numbers.
     * These will be stored as the strings "Nan", "INF", and "-INF" strings
     * instead.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {number} number - The number to write to the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    writeNumber(row, col, number) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeNumber(retptr, this.__wbg_ptr, row, col, number);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write a formatted number to a worksheet cell.
     *
     * Write a number with formatting to a worksheet cell. The format is set
     * via a {@link Format} struct which can control the numerical formatting of
     * the number, for example as a currency or a percentage value, or the
     * visual format, such as bold and italic text.
     *
     * TODO: improve docs
     * All numerical values in Excel are stored as [IEEE 754] Doubles which are
     * the equivalent of rust's [`f64`] type. This method will accept any rust
     * type that will convert [`Into`] a f64. These include i8, u8, i16, u16,
     * i32, u32 and f32 but not i64 or u64, see below.
     *
     * IEEE 754 Doubles and f64 have around 15 digits of precision. Anything
     * beyond that cannot be stored as a number by Excel without a loss of
     * precision and may need to be stored as a string instead.
     *
     * [IEEE 754]: https://en.wikipedia.org/wiki/IEEE_754
     *
     * For i64/u64 you can cast the numbers `as f64` which will allow you to
     * store the number with a loss of precision outside Excel's integer range
     * of +/- 999,999,999,999,999 (15 digits).
     *
     * Excel doesn't have handling for NaN or INF floating point numbers. These
     * will be stored as the strings "Nan", "INF", and "-INF" strings instead.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {number} number - The number to write to the cell.
     * @param {Format} format - The {@link Format} property for the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    writeNumberWithFormat(row, col, number, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeNumberWithFormat(retptr, this.__wbg_ptr, row, col, number, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write an unformatted boolean value to a cell.
     *
     * Write an unformatted Excel boolean value to a worksheet cell.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {boolean} boolean - The boolean value to write to the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    writeBoolean(row, col, boolean) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeBoolean(retptr, this.__wbg_ptr, row, col, boolean);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write a formatted boolean value to a worksheet cell.
     *
     * Write a boolean value with formatting to a worksheet cell. The format is set
     * via a {@link Format} struct which can control the numerical formatting of
     * the number, for example as a currency or a percentage value, or the
     * visual format, such as bold and italic text.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {boolean} boolean - The boolean value to write to the cell.
     * @param {Format} format - The {@link Format} property for the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     */
    writeBooleanWithFormat(row, col, boolean, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeBooleanWithFormat(retptr, this.__wbg_ptr, row, col, boolean, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Write an unformatted date and/or time to a worksheet cell.
     *
     * In general an unformatted date/time isn't very useful since a date in
     * Excel without a format is just a number. However, this method is
     * provided for cases where an implicit format is derived from the column
     * or row format.
     *
     * However, for most use cases you should use the
     * {@link Worksheet#writeDatetimeWithFormat} method with an explicit format.
     *
     * The date/time types supported are:
     * - {Date}
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Date} datetime - A date/time to write.
     * @return {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    writeDatetime(row, col, datetime) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeDatetime(retptr, this.__wbg_ptr, row, col, addBorrowedObject(datetime));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Write a formatted date and/or time to a worksheet cell.
     *
     * The method method writes dates/times that is of type {Date}.
     *
     * The date/time types supported are:
     * - {Date}
     *
     * Excel stores dates and times as a floating point number with a number
     * format to defined how it is displayed. The number format is set via a
     * {@link Format} struct which can also control visual formatting such as bold
     * and italic text.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Date} datetime - A date/time to write.
     * @param {Format} format - The {@link Format} property for the cell.
     * @return {Worksheet} - The worksheet object.
     *
     * TODO: example omitted
     */
    writeDatetimeWithFormat(row, col, datetime, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeDatetimeWithFormat(retptr, this.__wbg_ptr, row, col, addBorrowedObject(datetime), format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * Write a formatted date to a worksheet cell.
     *
     * Write a date/time value with formatting to a worksheet cell. The format is set
     * via a {@link Format} struct which can control the numerical formatting of
     * the number, for example as a currency or a percentage value, or the
     * visual format, such as bold and italic text.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Date} datetime - A date/time to write.
     * @param {Format} format - The {@link Format} property for the cell.
     * @return {Worksheet} - The worksheet object.
     *
     * TODO: example omitted
     */
    writeDateWithFormat(row, col, date, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(date, ExcelDateTime);
            _assertClass(format, Format);
            wasm.worksheet_writeDateWithFormat(retptr, this.__wbg_ptr, row, col, date.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Formula} formula
     * @returns {Worksheet}
     */
    writeFormula(row, col, formula) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            wasm.worksheet_writeFormula(retptr, this.__wbg_ptr, row, col, formula.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Formula} formula
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeFormulaWithFormat(row, col, formula, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            _assertClass(format, Format);
            wasm.worksheet_writeFormulaWithFormat(retptr, this.__wbg_ptr, row, col, formula.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Url} link
     * @returns {Worksheet}
     */
    writeUrl(row, col, link) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(link, Url);
            wasm.worksheet_writeUrl(retptr, this.__wbg_ptr, row, col, link.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Url} link
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeUrlWithFormat(row, col, link, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(link, Url);
            _assertClass(format, Format);
            wasm.worksheet_writeUrlWithFormat(retptr, this.__wbg_ptr, row, col, link.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Url} link
     * @param {string} text
     * @returns {Worksheet}
     */
    writeUrlWithText(row, col, link, text) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(link, Url);
            const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.worksheet_writeUrlWithText(retptr, this.__wbg_ptr, row, col, link.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Url} link
     * @param {string} text
     * @param {string} tip
     * @param {Format | null} [format]
     * @returns {Worksheet}
     */
    writeUrlWithOptions(row, col, link, text, tip, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(link, Url);
            const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(tip, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            let ptr2 = 0;
            if (!isLikeNone(format)) {
                _assertClass(format, Format);
                ptr2 = format.__destroy_into_raw();
            }
            wasm.worksheet_writeUrlWithOptions(retptr, this.__wbg_ptr, row, col, link.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {RichString} rich_string
     * @returns {Worksheet}
     */
    writeRichString(row, col, rich_string) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(rich_string, RichString);
            wasm.worksheet_writeRichString(retptr, this.__wbg_ptr, row, col, rich_string.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {RichString} rich_string
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeRichStringWithFormat(row, col, rich_string, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(rich_string, RichString);
            _assertClass(format, Format);
            wasm.worksheet_writeRichStringWithFormat(retptr, this.__wbg_ptr, row, col, rich_string.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {ExcelDataArray} values
     * @returns {Worksheet}
     */
    writeColumn(row, col, values) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeColumn(retptr, this.__wbg_ptr, row, col, addBorrowedObject(values));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {ExcelDataArray} values
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeColumnWithFormat(row, col, values, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeColumnWithFormat(retptr, this.__wbg_ptr, row, col, addBorrowedObject(values), format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {ExcelDataMatrix} data
     * @returns {Worksheet}
     */
    writeColumnMatrix(row, col, data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeColumnMatrix(retptr, this.__wbg_ptr, row, col, addBorrowedObject(data));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {ExcelDataArray} values
     * @returns {Worksheet}
     */
    writeRow(row, col, values) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeRow(retptr, this.__wbg_ptr, row, col, addBorrowedObject(values));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {ExcelDataArray} values
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeRowWithFormat(row, col, values, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_writeRowWithFormat(retptr, this.__wbg_ptr, row, col, addBorrowedObject(values), format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {ExcelDataMatrix} data
     * @returns {Worksheet}
     */
    writeRowMatrix(row, col, data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_writeRowMatrix(retptr, this.__wbg_ptr, row, col, addBorrowedObject(data));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            heap[stack_pointer++] = undefined;
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Formula} formula
     * @returns {Worksheet}
     */
    writeArrayFormula(first_row, first_col, last_row, last_col, formula) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            wasm.worksheet_writeArrayFormula(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, formula.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Formula} formula
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeArrayFormulaWithFormat(first_row, first_col, last_row, last_col, formula, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            _assertClass(format, Format);
            wasm.worksheet_writeArrayFormulaWithFormat(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, formula.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Formula} formula
     * @returns {Worksheet}
     */
    writeDynamicArrayFormula(first_row, first_col, last_row, last_col, formula) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            wasm.worksheet_writeDynamicArrayFormula(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, formula.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Formula} formula
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeDynamicArrayFormulaWithFormat(first_row, first_col, last_row, last_col, formula, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            _assertClass(format, Format);
            wasm.worksheet_writeDynamicArrayFormulaWithFormat(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, formula.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Formula} formula
     * @returns {Worksheet}
     */
    writeDynamicFormula(first_row, first_col, last_row, last_col, formula) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            wasm.worksheet_writeDynamicFormula(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, formula.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Formula} formula
     * @param {Format} format
     * @returns {Worksheet}
     */
    writeDynamicFormulaWithFormat(first_row, first_col, last_row, last_col, formula, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(formula, Formula);
            _assertClass(format, Format);
            wasm.worksheet_writeDynamicFormulaWithFormat(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, formula.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Table} table
     * @returns {Worksheet}
     */
    addTable(first_row, first_col, last_row, last_col, table) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(table, Table);
            wasm.worksheet_addTable(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, table.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Embed an image to a worksheet and fit it to a cell.
     *
     * This method can be used to embed a image into a worksheet cell and have
     * the image automatically scale to the width and height of the cell. The
     * X/Y scaling of the image is preserved but the size of the image is
     * adjusted to fit the largest possible width or height depending on the
     * cell dimensions.
     *
     * This is the equivalent of Excel's menu option to insert an image using
     * the option to "Place in Cell" which is only available in Excel 365
     * versions from 2023 onwards. For older versions of Excel a `#VALUE!`
     * error is displayed.
     *
     * The image should be encapsulated in an {@link Image} object. See
     * {@link Worksheet#insertImage} above for details on the supported image
     * types.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Image} image - The {@link Image} to insert into the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     * @param {number} row
     * @param {number} col
     * @param {Image} image
     * @returns {Worksheet}
     */
    embedImage(row, col, image) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            wasm.worksheet_embedImage(retptr, this.__wbg_ptr, row, col, image.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Image} image
     * @param {Format} format
     * @returns {Worksheet}
     */
    embedImageWithFormat(row, col, image, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            _assertClass(format, Format);
            wasm.worksheet_embedImageWithFormat(retptr, this.__wbg_ptr, row, col, image.__wbg_ptr, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add an image to a worksheet.
     *
     * Add an image to a worksheet at a cell location. The image should be
     * encapsulated in an {@link Image} object.
     *
     * The supported image formats are:
     *
     * - PNG
     * - JPG
     * - GIF: The image can be an animated gif in more recent versions of
     *   Excel.
     * - BMP: BMP images are only supported for backward compatibility. In
     *   general it is best to avoid BMP images since they are not compressed.
     *   If used, BMP images must be 24 bit, true color, bitmaps.
     *
     * EMF and WMF file formats will be supported in an upcoming version of the
     * library.
     *
     * **NOTE on SVG files**: Excel doesn't directly support SVG files in the
     * same way as other image file formats. It allows SVG to be inserted into
     * a worksheet but converts them to, and displays them as, PNG files. It
     * stores the original SVG image in the file so the original format can be
     * retrieved. This removes the file size and resolution advantage of using
     * SVG files. As such SVG files are not supported by `rust_xlsxwriter`
     * since a conversion to the PNG format would be required and that format
     * is already supported.
     *
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Image} image - The {@link Image} to insert into the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    insertImage(row, col, image) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            wasm.worksheet_insertImage(retptr, this.__wbg_ptr, row, col, image.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Image} image
     * @param {number} x_offset
     * @param {number} y_offset
     * @returns {Worksheet}
     */
    insertImageWithOffset(row, col, image, x_offset, y_offset) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            wasm.worksheet_insertImageWithOffset(retptr, this.__wbg_ptr, row, col, image.__wbg_ptr, x_offset, y_offset);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Image} image
     * @param {boolean} keep_aspect_ratio
     * @returns {Worksheet}
     */
    insertImageFitToCell(row, col, image, keep_aspect_ratio) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(image, Image);
            wasm.worksheet_insertImageFitToCell(retptr, this.__wbg_ptr, row, col, image.__wbg_ptr, keep_aspect_ratio);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add an chart to a worksheet.
     *
     * Add a chart to a worksheet at a cell location. The chart should be
     * encapsulated in an {@link Chart} object.
     *
     * The chart can be inserted as an object or as a background image.
     *
     * @param {number} row - The zero indexed row number.
     * @param {number} col - The zero indexed column number.
     * @param {Chart} chart - The {@link Chart} to insert into the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     *
     * TODO: example omitted
     */
    insertChart(row, col, chart) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(chart, Chart);
            wasm.worksheet_insertChart(retptr, this.__wbg_ptr, row, col, chart.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {Chart} chart
     * @param {number} x_offset
     * @param {number} y_offset
     * @returns {Worksheet}
     */
    insertChartWithOffset(row, col, chart, x_offset, y_offset) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(chart, Chart);
            wasm.worksheet_insertChartWithOffset(retptr, this.__wbg_ptr, row, col, chart.__wbg_ptr, x_offset, y_offset);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @returns {Worksheet}
     */
    clearCell(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_clearCell(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @returns {Worksheet}
     */
    clearCellFormat(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_clearCellFormat(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Autofit the worksheet column widths, approximately.
     *
     * There is no option in the xlsx file format that can be used to say
     * "autofit columns on loading". Auto-fitting of columns is something that
     * Excel does at runtime when it has access to all of the worksheet
     * information as well as the Windows functions for calculating display
     * areas based on fonts and formatting.
     *
     * The `rust_xlsxwriter` library doesn't have access to the Windows
     * functions that Excel has so it simulates autofit by calculating string
     * widths using metrics taken from Excel.
     *
     * As such, there are some limitations to be aware of when using this
     * method:
     *
     * - It is a simulated method and may not be accurate in all cases.
     * - It is based on the default Excel font type and size of Calibri 11. It
     *   will not give accurate results for other fonts or font sizes.
     * - It doesn't take number or date formatting into account, although it
     *   may try to in a later version.
     * - It iterates over all the cells in a worksheet that have been populated
     *   with data and performs a length calculation on each one, so it can
     *   have a performance overhead for larger worksheets. See Note 1 below.
     *
     * This isn't perfect but for most cases it should be sufficient and if not
     * you can adjust or prompt it by setting your own column widths via
     * {@link Worksheet#setColumnWidth} or
     * {@link Worksheet#setColumnWidthPixels}.
     *
     * The `autofit()` method ignores columns that have already been explicitly
     * set if the width is greater than the calculated autofit width.
     * Alternatively, setting the column width explicitly after calling
     * `autofit()` will override the autofit value.
     *
     * **Note 1**: As a performance optimization when dealing with large data
     * sets you can call `autofit()` after writing the first 50 or 100 rows.
     * This will produce a reasonably accurate autofit for the first visible
     * page of data without incurring the performance penalty of autofitting
     * thousands of non-visible rows.
     * @returns {Worksheet}
     */
    autofit() {
        const ret = wasm.worksheet_autofit(this.__wbg_ptr);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @returns {Worksheet}
     */
    autofilter(first_row, first_col, last_row, last_col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_autofilter(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Protect a worksheet from modification.
     *
     * The `protect()` method protects a worksheet from modification. It works
     * by enabling a cell's `locked` and `hidden` properties, if they have been
     * set. A **locked** cell cannot be edited and this property is on by
     * default for all cells. A **hidden** cell will display the results of a
     * formula but not the formula itself.
     *
     * <img
     * src="https://rustxlsxwriter.github.io/images/protection_alert.png">
     *
     * These properties can be set using the
     * {@link Format#setLocked}
     * {@link Format#setUnlocked} and
     * {@link Worksheet#setHidden} format methods. All cells
     * have the `locked` property turned on by default (see the example below)
     * so in general you don't have to explicitly turn it on.
     *
     * TODO: example omitted
     * @returns {Worksheet}
     */
    protect() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_protect(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Hide a worksheet.
     *
     * The `set_hidden()` method is used to hide a worksheet. This can be used
     * to hide a worksheet in order to avoid confusing a user with intermediate
     * data or calculations.
     *
     * In Excel a hidden worksheet can not be activated or selected so this
     * method is mutually exclusive with the {@link Worksheet#setActive} and
     * {@link Worksheet#setSelected} methods. In addition, since the first
     * worksheet will default to being the active worksheet, you cannot hide
     * the first worksheet without activating another sheet.
     *
     * @param {boolean} enable - Turn the property on/off. It is off by default.
     * @returns {Worksheet} - The worksheet object.
     *
     * TODO: example omitted
     */
    setHidden(enable) {
        const ret = wasm.worksheet_setHidden(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * Merge a range of cells.
     *
     * The `mergeRange()` method allows cells to be merged together so that
     * they act as a single area.
     *
     * The `mergeRange()` method writes a string to the merged cells. In order
     * to write other data types, such as a number or a formula, you can
     * overwrite the first cell with a call to one of the other
     * `worksheet.write*()` functions. The same {@link Format} instance should be
     * used as was used in the merged range, see the example below.
     *
     * @param {number} first_row - The first row of the range. (All zero indexed.)
     * @param {number} first_col - The first row of the range.
     * @param {number} last_row - The last row of the range.
     * @param {number} last_col - The last row of the range.
     * @param {string} value - The string to write to the cell. Other types can also be
     *   handled. See the documentation above and the example below.
     * @param {Format} format - The {@link Format} property for the cell.
     * @returns {Worksheet} - The worksheet object.
     *
     * # Errors
     *
     * - [`XlsxError::RowColumnLimitError`] - Row or column exceeds Excel's
     *   worksheet limits.
     * - [`XlsxError::RowColumnOrderError`] - First row larger than the last
     *   row.
     * - [`XlsxError::MergeRangeSingleCell`] - A merge range cannot be a single
     *   cell in Excel.
     * - [`XlsxError::MergeRangeOverlaps`] - The merge range overlaps a
     *   previous merge range.
     *
     * TODO: example omitted
     */
    mergeRange(first_row, first_col, last_row, last_col, value, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            _assertClass(format, Format);
            wasm.worksheet_mergeRange(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, ptr0, len0, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} height
     * @returns {Worksheet}
     */
    setRowHeight(row, height) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setRowHeight(retptr, this.__wbg_ptr, row, height);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} height
     * @returns {Worksheet}
     */
    setRowHeightPixels(row, height) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setRowHeightPixels(retptr, this.__wbg_ptr, row, height);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Format} format
     * @returns {Worksheet}
     */
    setRangeWithFormat(first_row, first_col, last_row, last_col, format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            wasm.worksheet_setRangeWithFormat(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} first_row
     * @param {number} first_col
     * @param {number} last_row
     * @param {number} last_col
     * @param {Format} format
     * @param {Format} border_format
     * @returns {Worksheet}
     */
    setRangeFormatWithBorder(first_row, first_col, last_row, last_col, format, border_format) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(format, Format);
            _assertClass(border_format, Format);
            wasm.worksheet_setRangeFormatWithBorder(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col, format.__wbg_ptr, border_format.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {Worksheet}
     */
    setLandscape() {
        const ret = wasm.worksheet_setLandscape(this.__wbg_ptr);
        return Worksheet.__wrap(ret);
    }
    /**
     * @returns {Worksheet}
     */
    setPortrait() {
        const ret = wasm.worksheet_setPortrait(this.__wbg_ptr);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {number} paper_size
     * @returns {Worksheet}
     */
    setPaperSize(paper_size) {
        const ret = wasm.worksheet_setPaperSize(this.__wbg_ptr, paper_size);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {number} number
     * @returns {Worksheet}
     */
    setPrintFirstPageNumber(number) {
        const ret = wasm.worksheet_setPrintFirstPageNumber(this.__wbg_ptr, number);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {number} scale
     * @returns {Worksheet}
     */
    setPrintScale(scale) {
        const ret = wasm.worksheet_setPrintScale(this.__wbg_ptr, scale);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {number} width
     * @param {number} height
     * @returns {Worksheet}
     */
    setPrintFitToPages(width, height) {
        const ret = wasm.worksheet_setPrintFitToPages(this.__wbg_ptr, width, height);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setPrintCenterHorizontally(enable) {
        const ret = wasm.worksheet_setPrintCenterHorizontally(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setPrintCenterVertically(enable) {
        const ret = wasm.worksheet_setPrintCenterVertically(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setScreenGridlines(enable) {
        const ret = wasm.worksheet_setScreenGridlines(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setPrintGridlines(enable) {
        const ret = wasm.worksheet_setPrintGridlines(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setPrintBlackAndWhite(enable) {
        const ret = wasm.worksheet_setPrintBlackAndWhite(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setPrintDraft(enable) {
        const ret = wasm.worksheet_setPrintDraft(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    /**
     * @param {boolean} enable
     * @returns {Worksheet}
     */
    setPrintHeadings(enable) {
        const ret = wasm.worksheet_setPrintHeadings(this.__wbg_ptr, enable);
        return Worksheet.__wrap(ret);
    }
    setPrintArea(first_row, first_col, last_row, last_col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setPrintArea(retptr, this.__wbg_ptr, first_row, first_col, last_row, last_col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    setRepeatRows(first_row, last_row) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setRepeatRows(retptr, this.__wbg_ptr, first_row, last_row);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    setRepeatColumns(first_col, last_col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_setRepeatColumns(retptr, this.__wbg_ptr, first_col, last_col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    insertNote(row, col, note) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(note, Note);
            wasm.worksheet_insertNote(retptr, this.__wbg_ptr, row, col, note.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Group a range of rows into a worksheet outline group.
     * # Parameters
     *
     * - `first_row`: The first row of the range. Zero indexed.
     * - `last_row`: The last row of the range.
     */
    groupRows(first_row, last_row) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.worksheet_groupRows(retptr, this.__wbg_ptr, first_row, last_row);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Worksheet.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_chartpoint_unwrap = function(arg0) {
        const ret = ChartPoint.__unwrap(takeObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_constructor_9fd96f589d65d4e5 = function(arg0) {
        const ret = getObject(arg0).constructor;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_from_2a5d3e218e67aa85 = function(arg0) {
        const ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getPrototypeOf_64af13611bceb86e = function(arg0) {
        const ret = Object.getPrototypeOf(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getTime_46267b1c24877e30 = function(arg0) {
        const ret = getObject(arg0).getTime();
        return ret;
    };
    imports.wbg.__wbg_get_67b2ba62fc30de12 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_b9b93047fe3cf45b = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_Date_e9a9be8b9cea7890 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Date;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_length_e2d2a49132c1b256 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_name_16617c8e9d4188ac = function(arg0) {
        const ret = getObject(arg0).name;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_now_807e54c39636c349 = function() {
        const ret = Date.now();
        return ret;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_tablecolumn_unwrap = function(arg0) {
        const ret = TableColumn.__unwrap(takeObject(arg0));
        return ret;
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = getObject(arg0);
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_array = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = getObject(arg0) === null;
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_typeof = function(arg0) {
        const ret = typeof getObject(arg0);
        return addHeapObject(ret);
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('wasm_xlsxwriter_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

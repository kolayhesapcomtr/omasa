/**
 * ESC/POS Command Utility
 * Generates ESC/POS commands for thermal printers
 */

export class ESCPOSUtil {
  // ESC/POS Control Characters
  private static readonly ESC = '\x1B';
  private static readonly GS = '\x1D';
  private static readonly LF = '\n';
  private static readonly CR = '\r';

  /**
   * Initialize printer
   */
  static initialize(): string {
    return this.ESC + '@';
  }

  /**
   * Text alignment
   */
  static align(alignment: 'left' | 'center' | 'right'): string {
    const alignMap = { left: 0, center: 1, right: 2 };
    return this.ESC + 'a' + String.fromCharCode(alignMap[alignment]);
  }

  /**
   * Text size (width and height multiplier)
   */
  static textSize(width: number = 1, height: number = 1): string {
    const size = ((width - 1) << 4) | (height - 1);
    return this.GS + '!' + String.fromCharCode(size);
  }

  /**
   * Bold text
   */
  static bold(enabled: boolean = true): string {
    return this.ESC + 'E' + (enabled ? '\x01' : '\x00');
  }

  /**
   * Underline
   */
  static underline(mode: 0 | 1 | 2 = 1): string {
    return this.ESC + '-' + String.fromCharCode(mode);
  }

  /**
   * Line feed (new line)
   */
  static feed(lines: number = 1): string {
    return this.ESC + 'd' + String.fromCharCode(lines);
  }

  /**
   * Cut paper
   */
  static cut(partial: boolean = false): string {
    return this.GS + 'V' + (partial ? 'A' : '\x00');
  }

  /**
   * Open cash drawer
   */
  static openDrawer(): string {
    return this.ESC + 'p' + '\x00' + '\x19' + '\xFA';
  }

  /**
   * Print and feed
   */
  static printAndFeed(lines: number = 1): string {
    return this.ESC + 'J' + String.fromCharCode(lines);
  }

  /**
   * Barcode (Code 128)
   */
  static barcode(data: string): string {
    const barcodeType = 73; // CODE128
    return (
      this.GS +
      'k' +
      String.fromCharCode(barcodeType) +
      String.fromCharCode(data.length) +
      data
    );
  }

  /**
   * QR Code
   */
  static qrCode(data: string, size: number = 6): string {
    const qrData = data;
    const qrSize = size;

    // Store QR code data
    let cmd = this.GS + '(k' + String.fromCharCode(qrData.length + 3, 0) + '1P0';
    cmd += qrData;

    // Set QR code size
    cmd += this.GS + '(k\x03\x00\x01C' + String.fromCharCode(qrSize);

    // Print QR code
    cmd += this.GS + '(k\x03\x00\x01Q0';

    return cmd;
  }

  /**
   * Divider line
   */
  static divider(width: number = 32, char: string = '-'): string {
    return char.repeat(width) + this.LF;
  }

  /**
   * Center text in line
   */
  static centerText(text: string, width: number = 32): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text + this.LF;
  }

  /**
   * Two column text (left and right aligned)
   */
  static twoColumns(left: string, right: string, width: number = 32): string {
    const spaces = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, spaces)) + right + this.LF;
  }

  /**
   * Format currency
   */
  static formatPrice(amount: number): string {
    return amount.toFixed(2) + ' TL';
  }

  /**
   * Format date/time
   */
  static formatDateTime(date: Date = new Date()): string {
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Wrap text to fit width
   */
  static wrapText(text: string, width: number = 32): string {
    if (text.length <= width) return text + this.LF;

    const words = text.split(' ');
    let lines = '';
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > width) {
        lines += currentLine.trim() + this.LF;
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine.trim()) {
      lines += currentLine.trim() + this.LF;
    }

    return lines;
  }
}

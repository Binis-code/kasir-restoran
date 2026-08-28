import { formatIDR } from "../data/menu";
import { t } from "../locales/en";
import { usePos } from "./PosContext";
import { usePrint } from "./PrintContext";

export function PrintLayer() {
  const print = usePrint();

  if (print.mode === "report" && print.report) {
    const r = print.report;
    return (
      <div id="print-root" aria-hidden="true">
        <div className="report-print">
          <h1>{r.title}</h1>
          <p className="rp-sub">{r.period}</p>
          <table>
            <thead>
              <tr>
                <th>{t.reportsPage.colDate}</th>
                <th className="num">{t.reportsPage.colOrders}</th>
                <th className="num">{t.reportsPage.colItems}</th>
                <th className="num">{t.reportsPage.colSales}</th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="num">{row.orders}</td>
                  <td className="num">{row.items}</td>
                  <td className="num">{row.sales}</td>
                </tr>
              ))}
              <tr className="report-total">
                <td>{t.reportsPage.totalRow}</td>
                <td className="num">{r.totalOrders}</td>
                <td className="num" />
                <td className="num">{r.totalSales}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <ReceiptPrint />;
}

function ReceiptPrint() {
  const pos = usePos();
  const { orderNo, orderType, tableNumber, guests, lines, totals } = pos;
  const hasItems = lines.length > 0;

  return (
    <div id="print-root" aria-hidden="true">
      <div className="receipt-print">
        <div className="rp-head">
          <p className="rp-logo">KASA</p>
          <p className="rp-tagline">{t.receipt.headerTagline}</p>
        </div>

        <div className="rp-sep" />

        <p className="rp-strong">
          {t.cart.orderPrefix} {orderNo} ·{" "}
          {orderType === "bawa-pulang"
            ? t.receipt.orderTypeTakeaway
            : t.receipt.orderTypeTable(tableNumber)}
          {orderType === "meja" ? ` · ${guests} ${t.cart.guestsUnit}` : ""}
        </p>
        <p className="rp-muted">
          {t.header.dateToday}
          <br />
          {t.receipt.cashierLine(t.cashier.name)}
        </p>

        <div className="rp-sep" />

        {hasItems ? (
          <>
            <table className="rp-items">
              <tbody>
                {lines.map((line) => {
                  const item = pos.products.find((p) => p.id === line.itemId);
                  if (!item) return null;
                  return (
                    <tr key={line.itemId}>
                      <td className="rp-qty">{line.qty}×</td>
                      <td className="rp-name">
                        {item.name}
                        <span className="rp-unit">
                          {" "}
                          {t.receipt.unitPrice(formatIDR(item.price))}
                        </span>
                      </td>
                      <td className="rp-amt">{formatIDR(item.price * line.qty)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="rp-sep" />

            <table className="rp-summary">
              <tbody>
                <tr>
                  <td>{t.receipt.productSubtotal}</td>
                  <td className="rp-amt">{formatIDR(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td>{t.receipt.taxLabel}</td>
                  <td className="rp-amt">{formatIDR(totals.tax)}</td>
                </tr>
                <tr className="rp-total-row">
                  <td>{t.receipt.totalLabel}</td>
                  <td className="rp-amt">{formatIDR(totals.total)}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <p className="rp-muted rp-center">{t.receipt.sampleNote}</p>
        )}

        <div className="rp-sep" />

        <p className="rp-center rp-muted">{t.receipt.thanks}</p>
        <p className="rp-center rp-muted">{t.receipt.keepReceipt}</p>
      </div>
    </div>
  );
}

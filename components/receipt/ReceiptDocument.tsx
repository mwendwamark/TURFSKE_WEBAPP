import styles from "./ReceiptDocument.module.css";
import {
  formatDateTime,
  formatRange,
  kes,
  type ReceiptData,
} from "./receipt-data";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}

export default function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <div className={styles.doc}>
      <p className={styles.brand}>TURFSKE</p>
      <p className={styles.kind}>Proof of payment</p>
      <hr className={styles.rule} />

      <dl className={styles.meta}>
        <Row label="Receipt no." value={data.reference} />
        {data.paidAt && <Row label="Paid on" value={formatDateTime(data.paidAt)} />}
        {data.payerName && <Row label="Customer" value={data.payerName} />}
        {data.payerEmail && <Row label="Email" value={data.payerEmail} />}
      </dl>

      <hr className={styles.rule} />

      <dl className={styles.meta}>
        <Row label="Venue" value={data.venueName} />
        <Row label="Pitch" value={data.pitchName} />
        <Row label="When" value={formatRange(data.startIso, data.endIso)} />
      </dl>

      <hr className={styles.rule} />

      <ul className={styles.lines}>
        {data.lines.map((line) => (
          <li key={line.label} className={styles.line}>
            <span className={styles.line_label}>{line.label}</span>
            <span className={styles.line_amount}>{kes(line.amount)}</span>
          </li>
        ))}
      </ul>

      <hr className={styles.rule} />

      <div className={styles.total}>
        <span>TOTAL PAID</span>
        <span>{kes(data.total)}</span>
      </div>

      <hr className={styles.rule} />

      <p className={styles.note}>
        Paid online through Paystack. Show this receipt at the venue if asked.
        This is a proof of payment, not a tax invoice.
      </p>
    </div>
  );
}
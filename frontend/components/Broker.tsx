// Phase 9: all text and contact details come from lib/broker.ts (one source shared with the footer and /about).
// Markup and classes are unchanged from the ported HTML.
import { broker } from "@/lib/broker";
import { BrokerContactList, BrokerPortrait, BrokerTagline, HouseDivider } from "./BrokerParts";

export default function Broker() {
  return (
    <section className="broker" id="broker">
      <div className="wrap broker-grid">
        <BrokerPortrait />
        <div className="broker-copy">
          <div className="broker-name">{broker.firstLine}</div>
          <h2>{broker.surnameLine}</h2>
          <div className="broker-title">{broker.title}</div>
          <HouseDivider />
          <BrokerContactList />
          <BrokerTagline />
        </div>
      </div>
    </section>
  );
}

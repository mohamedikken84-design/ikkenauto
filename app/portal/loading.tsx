import { PortalLogo } from "./portal-logo";

/** Immediately visible while the authenticated portal renders its own dealer data. */
export default function PortalLoading() {
  return <div className="portal-shell" aria-busy="true">
    <div className="portal-top"><PortalLogo/><span className="portal-top-caption">Dealerportaal</span></div>
    <main className="portal-container" aria-label="Dealerportaal laden">
      <div className="dealer-loading-layout">
        <div className="dealer-loading-sidebar" aria-hidden="true">
          {[86,68,94,62,78].map((width,i)=><div className="dealer-loading-line" key={i} style={{width:width+"%"}}/>)}
        </div>
        <div className="dealer-loading-content">
          <div className="dealer-loading-line dealer-loading-title" aria-hidden="true"/>
          <p className="dealer-loading-label">Dashboard laden…</p>
          <div className="dealer-loading-metrics" aria-hidden="true">
            {[1,2,3,4].map(i=><div className="dealer-loading-metric" key={i}>
              <div className="dealer-loading-line" style={{width:"48%"}}/>
              <div className="dealer-loading-line dealer-loading-value"/>
            </div>)}
          </div>
          <div className="dealer-loading-panel" aria-hidden="true">
            <div className="dealer-loading-line" style={{width:"31%"}}/>
            {[1,2,3].map(i=><div className="dealer-loading-row" key={i}><div className="dealer-loading-line" style={{width:"64%"}}/><div className="dealer-loading-line" style={{width:"21%"}}/></div>)}
          </div>
        </div>
      </div>
    </main>
  </div>;
}
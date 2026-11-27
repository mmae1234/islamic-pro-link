import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ExternalLink, Lock, Flag, Share2, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReportDialog from "@/components/ReportDialog";
import { SAFE_HTTPS_URL, urlHost } from "@/lib/orgTypes";
import { kindLabel, workplaceLabel, type Opportunity } from "@/lib/opportunities";

/** One job / internship / volunteer post. Apply links: https only, new tab, no referrer. */
const OpportunityCard = ({ item, signedIn, showBusiness = true, full = false }: {
  item: Opportunity;
  signedIn: boolean;
  showBusiness?: boolean;
  full?: boolean;
}) => {
  const [reportOpen, setReportOpen] = useState(false);
  const place = [item.city, item.state, item.country].filter(Boolean).join(", ");
  const safeApply = item.apply_url && SAFE_HTTPS_URL.test(item.apply_url) ? item.apply_url : null;
  const posted = new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const closes = item.closes_on
    ? new Date(`${item.closes_on}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{kindLabel(item.kind)}</Badge>
          <Badge variant="outline">{workplaceLabel(item.workplace)}</Badge>
          {showBusiness && item.business_name && (
            <Link to={`/business/${item.business_id}`} className="text-sm text-primary hover:underline">
              {item.business_name}
            </Link>
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          <Link to={`/jobs/${item.id}`} className="hover:underline">{item.title}</Link>
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {place && (
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {place}</span>
          )}
          {item.pay && <span>{item.pay}</span>}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> Posted {posted}{closes && ` · closes ${closes}`}
          </span>
        </div>
        {item.description && (
          <p className={`text-sm text-foreground whitespace-pre-wrap break-words ${full ? "" : "line-clamp-4"}`}>{item.description}</p>
        )}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          {signedIn ? (
            safeApply ? (
              <Button asChild size="sm" variant="accent">
                <a href={safeApply} target="_blank" rel="noopener noreferrer nofollow ugc" referrerPolicy="no-referrer">
                  Apply on {urlHost(safeApply)} <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </Button>
            ) : (
              <Button asChild size="sm" variant="accent">
                <Link to={`/business/${item.business_id}`}>
                  <MessageCircle className="w-4 h-4 mr-1" /> Contact {item.business_kind === "organization" ? "organization" : "business"}
                </Link>
              </Button>
            )
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <Link to={`/auth-gate?redirect=/jobs/${item.id}`} className="text-primary hover:underline">Sign in</Link>
              to apply.
            </p>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={async () => {
              const url = `https://muslimprosnet.com/jobs/${item.id}`;
              try {
                if (navigator.share) await navigator.share({ title: item.title, url });
                else await navigator.clipboard.writeText(url);
              } catch {
                /* cancelled */
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-1" /> Share
          </Button>
          {signedIn && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setReportOpen(true)}>
              <Flag className="w-4 h-4 mr-1" /> Report
            </Button>
          )}
        </div>
        {signedIn && (
          <ReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            accusedId={item.business_id}
            accusedName={item.title}
            opportunityId={item.id}
            reportType="opportunity"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default OpportunityCard;

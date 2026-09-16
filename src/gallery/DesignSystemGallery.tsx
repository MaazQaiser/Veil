import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Container,
  Dialog,
  Drawer,
  Dropdown,
  DropdownItem,
  EmptyState,
  ErrorState,
  Field,
  FilterBar,
  FilterChip,
  IconButton,
  Input,
  LoadingState,
  PageHeader,
  Pagination,
  Radio,
  SearchInput,
  SectionHeader,
  Select,
  Skeleton,
  Split,
  Stat,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThreeCol,
  Toast,
  Tooltip,
  TwoCol,
} from "@/components/ui";
import { IconBell, IconFilter, IconHandshake } from "@/components/ui/icons";
import {
  CityNav,
  CommunityPostCard,
  DemoPurchaseNotice,
  DistrictCard,
  DistrictSwitcher,
  DocumentCard,
  HandshakeStatus,
  ListingCard,
  MatchBreakdown,
  MatchCard,
  MatchPercent,
  NotificationCard,
  PlanComparison,
  ProfileCard,
  ProfileCompleteness,
  TrustSummary,
  VaelStatus,
  VerificationState,
  VisibilityStatus,
} from "@/components/vael";
import { VISIBILITY_PLANS } from "@/lib/visibilityPlans";
import { useCitySession } from "@/lib/citySession";
import { resetClientDemoData } from "@/lib/demoJourney";

const demoDistricts = [
  { id: "media-technology", name: "Media & Technology", status: "live" as const },
  { id: "contractor", name: "Contractor", status: "soon" as const },
  { id: "trucking", name: "Trucking", status: "soon" as const },
];

function GallerySection({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-12">
      <p className="vael-kicker">{kicker}</p>
      <h2 className="vael-h2 mt-2">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function DesignSystemGallery() {
  const { signOut } = useCitySession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [district, setDistrict] = useState("media-technology");
  const [toast, setToast] = useState("Handshake request sent");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CityNav current="home" />
      <div className="border-b border-border-subtle bg-background py-16 text-foreground md:py-24">
        <Container>
          <p className="vael-kicker">Visual system</p>
          <h1 className="vael-display mt-4">THE CITY OF VAEL</h1>
          <p className="vael-hero-copy mt-6 text-body-lg text-muted">
            Design-system gallery. SF Pro Display, warm paper, and one restrained accent — not a product screen.
          </p>
          <Button
            className="mt-8"
            variant="outline"
            onClick={() => {
              resetClientDemoData();
              signOut();
            }}
          >
            Reset Demo
          </Button>
          <p className="mt-3 max-w-copy text-caption text-muted">
            Presenter control. Returns Alex Morgan to not visible, with no VAEL, Handshake, or Connection. Also at{" "}
            <Link to="/demo/reset" className="underline">
              /demo/reset
            </Link>
            .
          </p>
        </Container>
      </div>

      <Container className="py-10">
        <PageHeader
          kicker="Gallery"
          title="Design system"
          description="Use semantic tokens. Do not restyle Media & Technology or invent new districts from this kit."
          crumbs={[
            { label: "City", href: "#top" },
            { label: "Design system" },
          ]}
          actions={
            <>
              <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
              <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                Open filters
              </Button>
            </>
          }
        />

        <nav aria-label="Gallery sections" className="mt-6 flex flex-wrap gap-2">
          {[
            ["color", "Color"],
            ["type", "Typography"],
            ["controls", "Controls"],
            ["cards", "Cards"],
            ["vael", "VAEL patterns"],
            ["states", "States"],
            ["layout", "Layout"],
          ].map(([href, label]) => (
            <a key={href} href={`#${href}`} className="text-label text-accent hover:text-accent-hover">
              {label}
            </a>
          ))}
        </nav>

        <GallerySection id="color" kicker="Foundations" title="Color">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Primary", "bg-primary text-primary-foreground"],
              ["Secondary", "bg-secondary text-secondary-foreground"],
              ["Surface", "bg-surface border border-border text-foreground"],
              ["Muted surface", "bg-surface-muted text-foreground"],
              ["Success", "bg-success-muted text-success"],
              ["Warning", "bg-warning-muted text-warning"],
              ["Destructive", "bg-destructive-muted text-destructive"],
              ["Info", "bg-info-muted text-info"],
            ].map(([name, cls]) => (
              <div key={name} className={`rounded-md px-3 py-6 text-caption ${cls}`}>
                {name}
              </div>
            ))}
          </div>
          <p className="mt-4 text-body-sm text-muted">
            Ink on warm paper. One muted blue-gray accent. Semantic greens and reds stay in labels, not on whole cards.
          </p>
        </GallerySection>

        <GallerySection id="type" kicker="Foundations" title="Typography">
          <div className="space-y-3">
            <p className="vael-display">Display — the City name</p>
            <p className="vael-h1">Heading 1 — Room title</p>
            <p className="vael-h2">Heading 2 — section</p>
            <p className="vael-h3">Heading 3 — card group</p>
            <p className="vael-h4">Heading 4 — card title</p>
            <p className="text-body-lg">Body large — lead paragraph for a Room.</p>
            <p className="text-body">Body — default reading size for listings and community.</p>
            <p className="text-body-sm">Body small — supporting copy, match reasons, helper text.</p>
            <p className="text-caption text-muted">Caption — timestamps, meta, legal notes.</p>
            <p className="vael-kicker">Label / kicker</p>
          </div>
        </GallerySection>

        <GallerySection id="controls" kicker="Primitives" title="Buttons, forms, navigation pieces">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Notifications">
              <IconBell />
            </IconButton>
            <Tooltip label="Request Handshake">
              <IconButton label="Handshake" variant="outline">
                <IconHandshake />
              </IconButton>
            </Tooltip>
          </div>

          <TwoCol className="mt-8">
            <Field htmlFor="handle" label="Handle" required hint="Unique in the City">
              <Input id="handle" name="handle" autoComplete="username" placeholder="your-handle" />
            </Field>
            <Field htmlFor="district" label="District">
              <Select id="district" defaultValue="media-technology">
                <option value="media-technology">Media & Technology</option>
                <option value="contractor">Contractor</option>
              </Select>
            </Field>
            <Field htmlFor="need" label="Need" error="Describe what you need before vaeling out.">
              <Textarea id="need" aria-invalid defaultValue="" />
            </Field>
            <div className="flex flex-col gap-3 pt-6">
              <Checkbox label="Show sample community posts" defaultChecked />
              <Radio name="side" label="Vael In — I am available" defaultChecked />
              <Radio name="side" label="Vael Out — I need someone" />
              <Switch label="Extended visibility (demo)" checked={switchOn} onCheckedChange={setSwitchOn} />
            </div>
          </TwoCol>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchInput placeholder="Search the City" />
            </div>
            <DistrictSwitcher districts={demoDistricts} value={district} onChange={setDistrict} />
            <Dropdown label="Account">
              <DropdownItem>Profile</DropdownItem>
              <DropdownItem>Visibility</DropdownItem>
              <DropdownItem>Sign out</DropdownItem>
            </Dropdown>
          </div>
        </GallerySection>

        <GallerySection id="cards" kicker="Surfaces" title="Cards share a language, not a template">
          <ThreeCol>
            <DistrictCard
              name="Media & Technology"
              status="live"
              summary="The only fully working district. Enter for Board, Vael, Handshake."
            />
            <DistrictCard
              name="Contractor"
              status="soon"
              summary="Placeholder lot. PRD name is Construction Exchange — Owner decision."
            />
            <DistrictCard name="Trucking" status="soon" summary="Coming Soon. No Board until matching exists." />
          </ThreeCol>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ListingCard
              title="Editor available this cycle"
              side="in"
              location="Remote · Atlanta"
              summary="24-hour Vael In. Discipline and tools stay Media & Technology-specific."
              hoursLeft={11}
            />
            <MatchCard
              name="Northlight Studio"
              role="Seeking editor"
              percent={84}
              why="Strong on discipline and timing. Tools overlap; budget is a proxy only."
            />
            <ProfileCard name="A. Mercer" handle="amercer" headline="Editor · documentary · Avid" />
            <ProfileCard name="Hidden until Handshake" handle="unknown" headline="" locked />
            <CommunityPostCard
              author="City feed"
              time="Today"
              body="Community is live for the City and Media & Technology. Unfinished lots do not invent posts."
            />
            <DocumentCard title="General liability" type="Insurance" status="review" />
            <NotificationCard title="Handshake pending" body="Both parties must accept before the private room opens." unread />
            <NotificationCard title="Vael expired" body="Re-vael to become visible again." />
          </div>
        </GallerySection>

        <GallerySection id="vael" kicker="Product patterns" title="Match, Vael, Handshake, trust">
          <div className="flex flex-wrap items-start gap-8">
            <MatchPercent value={84} size="lg" />
            <MatchPercent value={67} />
            <MatchPercent value={44} size="sm" />
            <div className="min-w-[16rem] flex-1">
              <MatchBreakdown
                items={[
                  { label: "Discipline", score: 92 },
                  { label: "Timing", score: 80 },
                  { label: "Tools", score: 71 },
                  { label: "Location", score: 54 },
                ]}
              />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <VaelStatus kind="in" hoursLeft={18} />
            <VaelStatus kind="out" hoursLeft={6} />
            <VaelStatus kind="expiring" hoursLeft={1} />
            <VaelStatus kind="expired" />
            <HandshakeStatus kind="pending" />
            <HandshakeStatus kind="connected" />
            <HandshakeStatus kind="declined" />
            <VerificationState kind="unverified" />
            <VerificationState kind="pending" />
          </div>
          <p className="mt-4 text-body-sm text-muted">
            Match bands are protected: Strong ≥80, Good ≥60, Possible ≥40. Do not retune Media & Technology weights from
            this gallery.
          </p>
        </GallerySection>

        <GallerySection id="trust-visibility" kicker="Trust & visibility" title="Honest states, structural plans">
          <div className="space-y-4">
            <TrustSummary />
            <ProfileCompleteness values={["Ada", "Editor", "", "Atlanta"]} />
            <VisibilityStatus kind="none" />
          </div>
          <p className="mt-4 text-caption text-muted">
            Pending and Verified exist as design tokens. Product screens only use Unverified until a workflow exists.
          </p>
          <DemoPurchaseNotice className="mt-6" />
          <div className="mt-6">
            <PlanComparison plans={VISIBILITY_PLANS} />
          </div>
        </GallerySection>

        <GallerySection id="states" kicker="Feedback" title="Empty, loading, error, confirm">
          <TwoCol>
            <Card>
              <EmptyState
                title="No matches in band yet"
                description="Vael In or Out to appear on the Board. Empty is honest, not decorative."
                action={<Button size="sm">Create VAEL</Button>}
              />
            </Card>
            <Card>
              <LoadingState label="Scoring the Board" />
              <Skeleton className="mt-4 h-16 w-full" />
            </Card>
            <ErrorState
              title="Board did not load"
              description="Prototype data lives in this browser. Nothing was sent to a live Foundation."
              action={
                <Button size="sm" variant="outline">
                  Try again
                </Button>
              }
            />
            <div className="flex flex-col gap-3">
              <Alert tone="info" title="SMS is not yet connected">
                In-app notices work locally. Other channels stay labeled until an Owner Change Order.
              </Alert>
              <Alert tone="warning" title="Demo pricing">
                Extended VAEL is not available for purchase.
              </Alert>
              {toast ? <Toast title={toast} onDismiss={() => setToast("")} /> : null}
            </div>
          </TwoCol>
          <div className="mt-6">
            <FilterBar count={12}>
              <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
              <FilterChip label="Vael In" active={filter === "in"} onClick={() => setFilter("in")} />
              <FilterChip label="Vael Out" active={filter === "out"} onClick={() => setFilter("out")} />
              <Button size="sm" variant="ghost">
                <IconFilter /> Filters
              </Button>
            </FilterBar>
          </div>
          <div className="mt-6">
            <Pagination page={page} pageCount={4} onPage={setPage} />
          </div>
        </GallerySection>

        <GallerySection id="layout" kicker="Structure" title="Split, tabs, stats">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Visibility" value="24h" hint="Default Vael" />
            <Stat label="Live district" value="1" hint="Media & Technology" />
            <Stat label="Match band" value="≥80" hint="Strong" />
          </div>
          <div className="mt-8">
            <Split
              sidebar={
                <Card>
                  <p className="vael-kicker">Sidebar</p>
                  <p className="mt-2 text-body-sm text-muted">
                    Becomes the drawer on small screens. Do not keep a persistent dashboard rail.
                  </p>
                </Card>
              }
            >
              <Tabs defaultValue="board">
                <TabsList>
                  <TabsTrigger value="board">Board</TabsTrigger>
                  <TabsTrigger value="handshake">Handshake</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="board">
                  <p className="text-body-sm">Percentage board is the district template. Fields change; the spine does not.</p>
                </TabsContent>
                <TabsContent value="handshake">
                  <p className="text-body-sm">Full profiles stay closed until both parties accept.</p>
                </TabsContent>
                <TabsContent value="profile">
                  <p className="text-body-sm">Verification can read Unverified until a real workflow exists.</p>
                </TabsContent>
              </Tabs>
            </Split>
          </div>
        </GallerySection>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Confirm Handshake"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Send request</Button>
          </>
        }
      >
        Both parties must accept before private profile details and messages open. This dialog is a pattern, not a live
        connection.
      </Dialog>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Board filters">
        <SectionHeader title="Filters" description="On mobile, filters leave the grid and live here." />
        <div className="flex flex-col gap-3">
          <Checkbox label="Strong matches only" />
          <Checkbox label="Remote" defaultChecked />
          <Button onClick={() => setDrawerOpen(false)}>Apply</Button>
        </div>
      </Drawer>
    </div>
  );
}

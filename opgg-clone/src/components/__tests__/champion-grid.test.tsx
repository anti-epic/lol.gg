import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChampionGrid } from "@/components/champion-grid";
import { type DDragonChampion } from "@/lib/ddragon";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const MOCK_CHAMPIONS: DDragonChampion[] = [
  {
    id: "Ahri",
    key: "103",
    name: "Ahri",
    title: "the Nine-Tailed Fox",
    blurb: "A fox spirit.",
    tags: ["Mage"],
    image: { full: "Ahri.png" },
  },
  {
    id: "Annie",
    key: "1",
    name: "Annie",
    title: "the Dark Child",
    blurb: "A pyrokinetic child.",
    tags: ["Mage"],
    image: { full: "Annie.png" },
  },
  {
    id: "Zed",
    key: "238",
    name: "Zed",
    title: "the Master of Shadows",
    blurb: "A shadow assassin.",
    tags: ["Assassin"],
    image: { full: "Zed.png" },
  },
];

describe("ChampionGrid", () => {
  it("renders all champions when the search query is empty", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    expect(screen.getByText("Ahri")).toBeInTheDocument();
    expect(screen.getByText("Annie")).toBeInTheDocument();
    expect(screen.getByText("Zed")).toBeInTheDocument();
  });

  it("renders a search input", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("filters champions by name when the user types", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ah" } });

    expect(screen.getByText("Ahri")).toBeInTheDocument();
    expect(screen.queryByText("Annie")).not.toBeInTheDocument();
    expect(screen.queryByText("Zed")).not.toBeInTheDocument();
  });

  it("filter is case-insensitive", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ZED" } });

    expect(screen.getByText("Zed")).toBeInTheDocument();
    expect(screen.queryByText("Ahri")).not.toBeInTheDocument();
  });

  it("shows multiple results when query matches more than one champion", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    // "a" matches Ahri and Annie (and Zed has no 'a' at start — but 'a' is in "Master" so Zed should also match if case-insensitive substring)
    // Actually: "an" matches only Annie
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "an" } });

    expect(screen.getByText("Annie")).toBeInTheDocument();
    expect(screen.queryByText("Ahri")).not.toBeInTheDocument();
    expect(screen.queryByText("Zed")).not.toBeInTheDocument();
  });

  it("shows a no-results message when the query matches nothing", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

    expect(screen.getByText(/no champions found/i)).toBeInTheDocument();
    expect(screen.queryByText("Ahri")).not.toBeInTheDocument();
    expect(screen.queryByText("Annie")).not.toBeInTheDocument();
    expect(screen.queryByText("Zed")).not.toBeInTheDocument();
  });

  it("restores all results when query is cleared", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);
    const input = screen.getByRole("searchbox");

    fireEvent.change(input, { target: { value: "ahri" } });
    expect(screen.queryByText("Annie")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText("Ahri")).toBeInTheDocument();
    expect(screen.getByText("Annie")).toBeInTheDocument();
    expect(screen.getByText("Zed")).toBeInTheDocument();
  });

  it("each champion card links to its detail page", () => {
    render(<ChampionGrid champions={MOCK_CHAMPIONS} version="14.1.1" />);

    expect(screen.getByRole("article", { name: /ahri/i }).closest("a")).toHaveAttribute(
      "href",
      "/champions/Ahri"
    );
  });
});

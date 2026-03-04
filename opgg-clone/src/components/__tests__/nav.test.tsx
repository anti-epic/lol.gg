import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "@/components/nav";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

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

describe("Nav", () => {
  it("renders the logo and both navigation links", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);

    expect(screen.getByText("lol.gg")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Champions" })).toBeInTheDocument();
  });

  it("marks Home as aria-current='page' when on /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Champions" })).not.toHaveAttribute("aria-current");
  });

  it("marks Champions as aria-current='page' when on /champions", () => {
    vi.mocked(usePathname).mockReturnValue("/champions");
    render(<Nav />);

    expect(screen.getByRole("link", { name: "Champions" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("marks Champions as active on a nested champion detail route", () => {
    vi.mocked(usePathname).mockReturnValue("/champions/Ahri");
    render(<Nav />);

    expect(screen.getByRole("link", { name: "Champions" })).toHaveAttribute("aria-current", "page");
  });

  it("does not mark Home as active on /champions", () => {
    vi.mocked(usePathname).mockReturnValue("/champions");
    render(<Nav />);

    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("logo links to /", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Nav />);

    expect(screen.getByText("lol.gg").closest("a")).toHaveAttribute("href", "/");
  });
});

export function isCustomerHomePath(pathname: string) {
  return pathname === "/" || pathname === "/profile" || pathname === "/trips";
}

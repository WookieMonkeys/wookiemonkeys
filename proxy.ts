import { auth } from "@/auth"
export { auth as proxy }
export default auth

export const config = {
  matcher: ["/admin/:path*"],
}

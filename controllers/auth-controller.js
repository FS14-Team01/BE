import {
  signUp as signUpService,
  login as loginService,
  refreshAccessToken as refreshAccessTokenService,
} from "../services/auth-service.js";

const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

async function signUp(req, res) {
  const { accessToken, refreshToken, user } = await signUpService(req.body);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    path: "/auth",
  });

  return res.status(201).json({ accessToken, user });
}

async function login(req, res) {
  const { accessToken, refreshToken, user } = await loginService(req.body);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    path: "/auth",
  });

  return res.status(200).json({ accessToken, user });
}

async function refreshAccessToken(req, res) {
  const refreshToken = req.cookies?.refreshToken;

  const { accessToken } = await refreshAccessTokenService(refreshToken);

  return res.status(200).json({ accessToken });
}

function logout(req, res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/auth",
  });

  return res.status(200).json({ message: "로그아웃되었습니다." });
}

export { signUp, login, refreshAccessToken, logout };

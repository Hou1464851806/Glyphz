package com.apriverse.glyphz.utils;

import jakarta.servlet.http.Cookie;

public class Token {
    public static String GetTokenFromCookies(Cookie[] cookies) {
        String token = null;
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        return token;
    }
}
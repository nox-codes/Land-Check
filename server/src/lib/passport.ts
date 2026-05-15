import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import argon2 from 'argon2';
import { prisma } from './prisma';
import type { JwtPayload } from '../modules/auth/auth.service';

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return done(null, false);
      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) return done(null, false);
      return done(null, user);
    } catch (err) { return done(err); }
  })
);

passport.use(
  new JwtStrategy(
    { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: process.env.JWT_SECRET! },
    async (payload: JwtPayload, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) { return done(err); }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), undefined);
        const user = await prisma.user.upsert({
          where: { email },
          update: { googleId: profile.id },
          create: { email, googleId: profile.id },
        });
        return done(null, user);
      } catch (err) { return done(err as Error, undefined); }
    }
  )
);

export default passport;

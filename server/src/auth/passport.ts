import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import * as userController from '../controllers/userController';
import * as adminController from '../controllers/adminController';

passport.use(
  new LocalStrategy(async (username: string, password: string, done) => {
    try {
      // try regular user
      const userDTO = await userController.loginUser({ username, password } as any);
      return done(null, userDTO);
    } catch {
      // if user auth failed, try officer
      try {
        const officerDTO = await adminController.loginOfficer({ username, password } as any);
        return done(null, officerDTO);
      } catch (err: any) {
        return done(null, false, err);
      }
    }
  })
);

// store username in session
passport.serializeUser((user: any, done) => {
  done(null, user.username);
});

passport.deserializeUser(async (username: string, done) => {
  try {
    // fetch user by username and map to DTO
    const user = await userController.getUserByUsername(username);
    done(null, user);
  } catch (err) {
    try {
      // if not found, try officer
      const officerDto = await adminController.getMunicipalityOfficerByUsername(username);
      if (!officerDto) return done(null, false);
      return done(null, officerDto);
    } catch (offErr) {
      done(null, offErr as Error);
    }
  }
});

export default passport;

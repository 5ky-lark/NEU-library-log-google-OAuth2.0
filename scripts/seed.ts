import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../src/models/Admin";
import Visitor from "../src/models/Visitor";
import VisitLog from "../src/models/VisitLog";
import { COLLEGES, VISIT_REASONS } from "../src/lib/constants";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/neu-library";
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK || "";

const RAW_ACCOUNTS = `
"JOYCE ANN Z. CLEOFE" <jazcleofe@neu.edu.ph>, "Alfanta, Jhun Huxly M." <jhunhuxly.alfanta@neu.edu.ph>, "Alingod, John Cedrick" <johncedrick.alingod@neu.edu.ph>, "Alwin M. Loterte" <alwin.loterte@neu.edu.ph>, "Amor, Urich Allen" <urichallen.amor@neu.edu.ph>, "Arisgado, Kyoichi" <kyoichi.arisgado@neu.edu.ph>, "Aspe, Mariela L." <mariela.aspe@neu.edu.ph>, "Banban, Demuri S." <demuri.banban@neu.edu.ph>, "Barcellano, Alliah N." <alliah.barcellano@neu.edu.ph>, "Bernante, Sean Christian P." <seanchristian.bernante@neu.edu.ph>, "Cancino, John Joseph V." <johnjoseph.cancino@neu.edu.ph>, "Contado, Jolina M." <jolina.contado@neu.edu.ph>, "Cordolla, Paolo V." <paolo.cordolla@neu.edu.ph>, "Cureg, Shiela Marie F." <shielamarie.cureg@neu.edu.ph>, "De Guzman, John Robert F." <johnrobert.deguzman@neu.edu.ph>, "Del Rosario, Juan Carlos T." <juancarlos.delrosario@neu.edu.ph>, "Diaz, Erick Jed O." <erickjed.diaz@neu.edu.ph>, "Dino, David C." <david.dino@neu.edu.ph>, "Eclarin Raymond T." <raymond.eclarin@neu.edu.ph>, "Edison B. Lazaro" <edison.lazaro@neu.edu.ph>, "Efraim B. Adenit" <efraim.adenit@neu.edu.ph>, "EQUE, FREN REINAN C." <frenreinan.eque@neu.edu.ph>, "Gacosta,Jhonlloyd B." <jhonlloyd.gacosta@neu.edu.ph>, "Gonida, Marlon T." <marlon.gonida@neu.edu.ph>, "Hadji Osoph, Insan M." <insan.hadjiosoph@neu.edu.ph>, "Hamdan, Nhur Brianne A." <nhurbrianne.hamdan@neu.edu.ph>, "Huerte, Jay O." <jay.huerte@neu.edu.ph>, "Ignacio, Gerry D." <gerry.ignacio@neu.edu.ph>, "Jazon, Junella Mariz S." <junellamariz.jazon@neu.edu.ph>, "Jeremy Ashley S. Viray" <jeremyashley.viray@neu.edu.ph>, "Jodilber P. Corpuz" <jodilber.corpuz@neu.edu.ph>, "Joe S. Dominguez" <joe.dominguez@neu.edu.ph>, "John Lloyd L. Tupaz" <johnlloyd.tupaz@neu.edu.ph>, John Mark Garcia <johnmark.garcia@neu.edu.ph>, "Keziel Claire M. Valencia" <kezielclaire.valencia@neu.edu.ph>, "Langit Bourgy D." <bourgy.langit@neu.edu.ph>, "Limjuco, Jemel M." <jemel.limjuco@neu.edu.ph>, "Lorena, Karl Androe V." <karlandroe.lorena@neu.edu.ph>, "Lorente, Lloyd Jefferson" <lloydjefferson.lorente@neu.edu.ph>, "Magayano, John Rafael L." <johnrafael.magayano@neu.edu.ph>, "Magsilang, Skylark G." <skylark.magsilang@neu.edu.ph>, Marticio Adrian <adrian.marticio@neu.edu.ph>, "Mike Ruiz A. Chua" <mikeruiz.chua@neu.edu.ph>, "Moniegos, Zamir A." <zamir.moniegos@neu.edu.ph>, "Moral, Kenneth O." <kenneth.moral@neu.edu.ph>, "Moreno, Jerome L" <jerome.moreno@neu.edu.ph>, "Nakpil, Timothy Sean Carlos C." <timothyseancarlos.nakpil@neu.edu.ph>, "NIGPARANON Renier C." <renier.nigparanon@neu.edu.ph>, "Nillo, Kim Bryan A." <kimbryan.nillo@neu.edu.ph>, "Nuqui, Althea L." <althea.nuqui@neu.edu.ph>, "Pascual, Yumi C." <yumi.pascual@neu.edu.ph>, "Peña, Jaspher John" <jaspherjohn.pena@neu.edu.ph>, "Perfecto, Mark Karevin D." <markkarevin.perfecto@neu.edu.ph>, "R-Chie M. Romano" <r-chie.romano@neu.edu.ph>, "Rabang, Kenneth Ryan O." <kennethryan.rabang@neu.edu.ph>, "Randel Redd B. Rivera" <randelredd.rivera@neu.edu.ph>, "Rodriguez, Justine D." <justine.rodriguez@neu.edu.ph>, "Sacyaten Adam Karn F." <adamkarn.sacyaten@neu.edu.ph>, "Saladino, Zhane B." <zhane.saladino@neu.edu.ph>, "Santiago, James D." <james.santiago@neu.edu.ph>, "SOMBLINGO, Maria Hanna Zhel C." <mariahannazhel.somblingo@neu.edu.ph>, "Songco, Carl Jasper V." <carljasper.songco@neu.edu.ph>, "Soriano, Rolando Jr. D." <rolandojr.soriano@neu.edu.ph>, "Sta Rita John Paul A." <johnpaul.sta.rita@neu.edu.ph>, "Tecson, EJ Karl N." <ejkarl.tecson@neu.edu.ph>, "Trinidad, Jhanery C." <jhanery.trinidad@neu.edu.ph>, "Tumolva, Warren Angelo B." <warrenangelo.tumolva@neu.edu.ph>, "Ubaldo, Jon Carl N." <joncarl.ubaldo@neu.edu.ph>, "Villanueva, Darwin Gerald G." <darwingerald.villanueva@neu.edu.ph>, "Yassy Adrienne D. Lamata" <yassyadrienne.lamata@neu.edu.ph>, "Zata, Leo" <leo.zata@neu.edu.ph>

"Aaliyah Mae . Sarco" <aaliyahmae.sarco@neu.edu.ph>, "Abby Criel N. Bicera" <abbycriel.bicera@neu.edu.ph>, "Aguilar, Josh Philip B." <joshphilip.aguilar@neu.edu.ph>, "Alfred Dunhill M. Caldito" <alfreddunhill.caldito@neu.edu.ph>, "Alvin S. Pareja" <alvin.pareja@neu.edu.ph>, "Anna Ybtezam M. Bashier" <annaybtezam.bashier@neu.edu.ph>, "Avelino Mico C. De Guzman III" <avelinomico.deguzmanlll@neu.edu.ph>, "Christian James V. Gavito" <christianjames.gavito@neu.edu.ph>, "Clark Dominic A. Olfindo" <clarkdominic.olfindo@neu.edu.ph>, "Daryl Jon V. Ocampo" <daryljon.ocampo@neu.edu.ph>, "Derek Mathew P. Gines" <derekmathew.gines@neu.edu.ph>, "Georees Clint C. Cagampang" <georeesclint.cagampang@neu.edu.ph>, "Hakim E. Lawi" <hakim.lawi@neu.edu.ph>, "James B. Cañaveral" <james.canaveral@neu.edu.ph>, "Jhon Dave T. Galariana" <jhondave.galariana@neu.edu.ph>, "Jhuzt Reinz D. Dumalag" <jhuztreinz.dumalag@neu.edu.ph>, "Johanna Cassandra M. Yburan" <johannacassandra.yburan@neu.edu.ph>, "John Angelo D. Juanillo" <johnangelo.juanillo@neu.edu.ph>, "John Denzel H. Ong" <johndenzel.ong@neu.edu.ph>, "John Lloyd G. Bergonia" <johnlloyd.bergonia@neu.edu.ph>, "Kasmir Vincey M. Dela Cruz" <kasmirvincey.delacruz@neu.edu.ph>, "Legion, Calrence B." <calrence.legion@neu.edu.ph>, "Magsilang, Skylark G." <skylark.magsilang@neu.edu.ph>, "Marjolaine A. Recto" <marjolaine.recto@neu.edu.ph>, Mark Akira Despi <markakira.despi@neu.edu.ph>, "Mary Hazel F. Abonitalla" <maryhazel.abonitalla@neu.edu.ph>, "Melody D. Saberola" <melody.saberola@neu.edu.ph>, "Narzoles, Ejay M." <ejay.narzoles@neu.edu.ph>, "Nico Jay D. Goneda" <nicojay.goneda@neu.edu.ph>, "Noemie J. Garlando" <noemie.garlando@neu.edu.ph>, "Rannie B. Evangelista" <rannie.evangelista@neu.edu.ph>, "Rawicz R. Mabato" <rawicz.mabato@neu.edu.ph>, "Ryan Benedict ll B. Gonzales" <ryanbenedictii.gonzales@neu.edu.ph>, "Samantha Nicole V. Arcilla" <samanthanicole.arcilla@neu.edu.ph>, "Sean Haissem M. Pineda" <seanhaissem.pineda@neu.edu.ph>, "Sean Marcus Andrei P. Ison" <seanmarcusandrei.ison@neu.edu.ph>, "Shekinah A. Quintinita" <shekinah.quintinita@neu.edu.ph>, "Tapis, Felix Matthew P." <felixmatthew.tapis@neu.edu.ph>, Unknown User <johnmark.sambilay@neu.edu.ph>, "Villodres, Jastene Kurtt Mckey A." <jastenekurttmckey.villodres@neu.edu.ph>, "Yuan Benedict D. Luzano" <yuanbenedict.luzano@neu.edu.ph>

"Gabuyo, Maegan Rose M." <maeganrose.gabuyo@neu.edu.ph>, JOEMAR SILAO <jasilao@neu.edu.ph>, "Acorda, Fredrickson C." <fredrickson.acorda@neu.edu.ph>, "Alfanta, Jhun Huxly M." <jhunhuxly.alfanta@neu.edu.ph>, "Alwin M. Loterte" <alwin.loterte@neu.edu.ph>, "Aquino,Godwyn A." <godwyn.aquino@neu.edu.ph>, "Arangorin, Justin Louie V." <justinlouie.arangorin@neu.edu.ph>, "Aspe, Mariela L." <mariela.aspe@neu.edu.ph>, "Aycardo, Jossel C." <jossel.aycardo@neu.edu.ph>, "Belen, Gabriel G." <gabriel.belen@neu.edu.ph>, "Cadaño, John Lee Aeolus F." <johnleeaeolus.cadano@neu.edu.ph>, "Casilla, John Erwin M." <johnerwinderk.casilla@neu.edu.ph>, "Ciriaco, Jr. Reynaldo E." <reynaldo.ciriacojr@neu.edu.ph>, "Cordolla, Paolo V." <paolo.cordolla@neu.edu.ph>, "Darren Justine B. Deazeta" <darrenjustine.deazeta@neu.edu.ph>, "Esmende, Daniel D." <daniel.esmende@neu.edu.ph>, Jerico Jimenez <jerico.jimenez@neu.edu.ph>, "Keziel Claire M. Valencia" <kezielclaire.valencia@neu.edu.ph>, "Limjuco, Jemel M." <jemel.limjuco@neu.edu.ph>, "Magsilang, Skylark G." <skylark.magsilang@neu.edu.ph>, "Mallare, Thea Anne Mae E." <theaannemae.mallare@neu.edu.ph>, "Manalo, Nasha R." <nasha.manalo@neu.edu.ph>, Marticio Adrian <adrian.marticio@neu.edu.ph>, "Millena, Kim Angelo Rafael C." <kimangelorafael.millena@neu.edu.ph>, "NIGPARANON Renier C." <renier.nigparanon@neu.edu.ph>, "Pascual, Yumi C." <yumi.pascual@neu.edu.ph>, "Porras, Janur J." <janur.porras@neu.edu.ph>, "Ranara, Neil Joseph L." <neiljoseph.ranara@neu.edu.ph>, "Randel Redd B. Rivera" <randelredd.rivera@neu.edu.ph>, "SANGALANG, Orlie John M." <orliejohn.sangalang@neu.edu.ph>, "Santiago, Paul Garren T." <paulgarren.santiago@neu.edu.ph>, "Tanaleon, Kyle L." <kyle.tanaleon@neu.edu.ph>, "Tumolva, Warren Angelo B." <warrenangelo.tumolva@neu.edu.ph>, "Villanueva, Kaye Adriele S." <kayeadriele.villanueva@neu.edu.ph>, "Zata, Leo" <leo.zata@neu.edu.ph>
`;

const TEACHER_OVERRIDES: Record<string, { name: string; program: string }> = {
  "jasilao@neu.edu.ph": {
    name: "JOEMAR SILAO",
    program: "College of Computer Studies / Informatics",
  },
  "jazcleofe@neu.edu.ph": {
    name: "JOYCE ANN Z. CLEOFE",
    program: "College of Computer Studies / Informatics",
  },
};

const EXCLUDED_SEED_EMAILS = new Set<string>([
  "jcesperanza@neu.edu.ph",
]);

type AccountSeed = {
  name: string;
  email: string;
};

function parseAccounts(raw: string): AccountSeed[] {
  const regex = /"?([^"<]+?)"?\s*<\s*([a-zA-Z0-9._%+-]+@neu\.edu\.ph)\s*>/g;
  const deduped = new Map<string, AccountSeed>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const name = match[1].replace(/^,\s*/, "").trim().replace(/\s+/g, " ");
    const email = match[2].trim().toLowerCase();
    if (!deduped.has(email)) {
      deduped.set(email, { name, email });
    }
  }

  return Array.from(deduped.values());
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateBetween(start: Date, end: Date): Date {
  const ts = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const d = new Date(ts);
  d.setMinutes(Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function parseDateOnly(dateText?: string): Date | null {
  if (!dateText) return null;
  const m = dateText.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || Number.isNaN(day)) {
    return null;
  }
  return new Date(year, monthIndex, day);
}

async function seed() {
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (
      MONGODB_URI.startsWith("mongodb+srv://") &&
      err?.code === "ECONNREFUSED" &&
      MONGODB_URI_FALLBACK
    ) {
      console.log("Primary MongoDB SRV lookup failed. Trying fallback URI...");
      await mongoose.connect(MONGODB_URI_FALLBACK);
    } else {
      throw error;
    }
  }
  console.log("Connected.");

  await Visitor.updateMany({ type: "faculty" }, { $set: { type: "teacher" } });

  for (const excludedEmail of Array.from(EXCLUDED_SEED_EMAILS)) {
    const existing = await Visitor.findOne({ email: excludedEmail }).select("_id").lean();
    if (existing?._id) {
      await VisitLog.deleteMany({ visitor: existing._id });
      await Visitor.deleteOne({ _id: existing._id });
      console.log(`Removed excluded seeded account: ${excludedEmail}`);
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@neu.edu.ph";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin ${adminEmail} already exists. Skipping admin seed.`);
  } else {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      email: adminEmail,
      password: hashed,
      name: "Library Admin",
    });
    console.log(`Created admin: ${adminEmail} (password: ${adminPassword})`);
  }

  const parsedAccounts = parseAccounts(RAW_ACCOUNTS);
  const allAccounts = new Map<string, AccountSeed>();
  for (const account of parsedAccounts) {
    if (!EXCLUDED_SEED_EMAILS.has(account.email)) {
      allAccounts.set(account.email, account);
    }
  }

  for (const [email, teacher] of Object.entries(TEACHER_OVERRIDES)) {
    if (!EXCLUDED_SEED_EMAILS.has(email)) {
      allAccounts.set(email, { email, name: teacher.name });
    }
  }

  const seedAccounts = Array.from(allAccounts.values());
  console.log(`Preparing ${seedAccounts.length} account(s)...`);

  const seededVisitors: Array<{ _id: mongoose.Types.ObjectId }> = [];
  for (const account of seedAccounts) {
    const email = account.email.toLowerCase();
    const teacherOverride = TEACHER_OVERRIDES[email];
    const isTeacher = Boolean(teacherOverride);

    const visitor = await Visitor.findOneAndUpdate(
      { email },
      {
        $set: {
          name: teacherOverride?.name || account.name,
          email,
          program: teacherOverride?.program || randomFrom(COLLEGES),
          type: isTeacher ? "teacher" : "student",
          blocked: false,
        },
        $unset: { blockedReason: "" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (visitor?._id) {
      seededVisitors.push({ _id: visitor._id });
    }
  }

  const configuredStart = parseDateOnly(process.env.SEED_START_DATE);
  const configuredEnd = parseDateOnly(process.env.SEED_END_DATE);
  const seedWindowDays = Math.max(1, Number(process.env.SEED_WINDOW_DAYS || "75"));

  const end = configuredEnd || new Date();
  end.setHours(23, 59, 59, 999);

  const start = configuredStart || new Date(end);
  if (!configuredStart) {
    start.setDate(start.getDate() - seedWindowDays);
  }
  start.setHours(0, 0, 0, 0);

  const visitorIds = seededVisitors.map((v) => v._id);
  await VisitLog.deleteMany({ visitor: { $in: visitorIds }, checkInTime: { $gte: start, $lte: end } });

  const logsToInsert: Array<{
    visitor: mongoose.Types.ObjectId;
    reason: (typeof VISIT_REASONS)[number];
    checkInTime: Date;
    checkOutTime?: Date;
  }> = [];

  for (const visitor of seededVisitors) {
    const logCount = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < logCount; i += 1) {
      const checkInTime = randomDateBetween(start, end);
      const withCheckout = Math.random() < 0.7;
      const checkoutMinutes = 30 + Math.floor(Math.random() * 180);
      const checkOutTime = withCheckout
        ? new Date(checkInTime.getTime() + checkoutMinutes * 60 * 1000)
        : undefined;

      logsToInsert.push({
        visitor: visitor._id,
        reason: randomFrom(VISIT_REASONS),
        checkInTime,
        ...(checkOutTime ? { checkOutTime } : {}),
      });
    }
  }

  if (logsToInsert.length > 0) {
    await VisitLog.insertMany(logsToInsert);
  }

  console.log(`Seeded/updated ${seededVisitors.length} account(s).`);
  console.log(
    `Inserted ${logsToInsert.length} visit log(s) from ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}.`
  );

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

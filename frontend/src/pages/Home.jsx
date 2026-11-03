import { Link, useLocation } from "wouter";
import { Heart, Users } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { AppLayout } from "../components/layout/AppLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { motion } from "framer-motion";
export default function Home() {
    const { isSignedIn: isAuthenticated } = useAuth();
    const [, navigate] = useLocation();
    const login = () => navigate("/sign-up");
    return (<AppLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none"/>
        
        {/* Abstract decorative shapes */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none"/>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                <span>Home-Based Care Learning for Africa</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-[1.1] mb-6 tracking-tight">
                Empowering care through <span className="text-primary">knowledge</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Online training for home care workers and family carers across Africa. Build confidence, develop your knowledge, and support safe, person-centred care.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (<Button size="lg" asChild className="rounded-full px-8 text-base shadow-lg shadow-primary/25">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>) : (<>
                    <Button size="lg" asChild className="rounded-full px-8 text-base shadow-lg shadow-primary/25">
                      <Link href="/courses">Browse Courses</Link>
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => login()} className="rounded-full px-8 text-base border-primary/20 hover:bg-primary/5">
                      Register as a Careworker
                    </Button>
                  </>)}
              </div>
              
              <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <span>Free access</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Instant certificates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Self-paced</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative lg:ml-auto w-full max-w-lg mx-auto">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-8 border-background relative">
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10"/>
                <img src={`${import.meta.env.BASE_URL}images/hero-caring.png`} alt="Care worker helping elderly person" className="w-full h-full object-cover"/>
              </div>
              
              {/* Floating badge */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border border-border/50 flex items-center gap-4">
                <div>
                  <p className="text-sm font-bold text-foreground">CPD Accredited</p>
                  <p className="text-xs text-muted-foreground">Download instantly</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Audiences Section */}
      <section className="py-24 bg-card border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Training tailored for you</h2>
            <p className="text-muted-foreground text-lg">Whether you're starting your career, managing a team, or caring for a loved one at home.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
            {
                title: "Care Workers",
                icon: Heart,
                desc: "Complete your induction, stay up to date with refresher courses, and build your professional portfolio.",
                color: "text-primary",
                bg: "bg-primary/10"
            },
            {
                title: "Family Carers",
                icon: Heart,
                desc: "Learn safe moving and handling, medication awareness, and how to best support your loved ones at home.",
                color: "text-accent",
                bg: "bg-accent/10"
            },
            {
                title: "Care Managers",
                icon: Users,
                desc: "Track your team's compliance, assign courses, and ensure high standards across your care service.",
                color: "text-blue-500",
                bg: "bg-blue-500/10"
            }
        ].map((item, i) => (<div key={i} className="bg-background rounded-2xl p-8 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                <div className={`${item.bg} ${item.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                  <item.icon className="w-7 h-7"/>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground mb-6">{item.desc}</p>
                <Link href={`/courses?targetAudience=${item.title.toLowerCase().replace(' ', '_')}`} className={`inline-flex items-center font-semibold ${item.color} hover:underline`}>
                  Explore courses
                </Link>
              </div>))}
          </div>
        </div>
      </section>
    </AppLayout>);
}

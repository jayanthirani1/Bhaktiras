import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className = "" }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`mb-8 text-center ${className}`}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{title}</h1>
      {subtitle && (
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">{subtitle}</p>
      )}
      <div className="mt-4 mx-auto w-16 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
    </motion.div>
  );
}

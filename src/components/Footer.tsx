export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background text-foreground border-t border-border">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            © {currentYear} Embutidos Mardely. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

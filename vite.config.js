import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Assurez-vous que le répertoire racine est correctement défini
  // Par défaut, c'est le répertoire où se trouve vite.config.js
  root: '.', 
  build: {
    // Le répertoire de sortie pour les fichiers de construction
    outDir: 'dist',
    // Le répertoire qui sera servi comme racine pour les fichiers statiques
    // Par défaut, c'est 'public', mais si index.html est à la racine du projet,
    // il n'est pas nécessaire de le spécifier ou de le changer.
    // publicDir: 'public', 
    rollupOptions: {
      // Spécifier explicitement l'entrée principale
      input: {
        main: 'index.html'
      }
    }
  }
});

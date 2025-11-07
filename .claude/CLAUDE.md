# Pasdrowka

Det här är ett minimalt HTML-projekt för att skapa en pappersbaserad lösenordshanterare. Det är en frontend-applikation som består av html, css och okompilerad javascript. Det är allt, och så ska det förblir.

## Applikationsstruktur

Filen `index.html` är huvudsidan. Den refererar till `impl.js` som är javascript-implementationen, samt `style.css` med CSS-koden.

Applikationstillståndet representeras direkt i dom-trädet. Inget javascript-ramverk används. Så för att få applikationens tillstånd läser man alltså av dom-trädet.

## Vad applikationen gör

Applikationen låter användaren generera en slumpmässig lösenordsnyckel genom att klicka på knappen "Generate" eller liknande. Denna nyckel genereras baserat på vad som matats in under avsnittet "Configuration".

Själva lösenordsnyckeln representeras av två textsträngar: "Input spec" och "Output spec", se avsnittet "Spec". Om man har dessa textsträngar kan lösenordshanteraren återskapas.

Om man klickar på knappen "Render" renderas lösenordshanteraren från specen till en SVG som man kan skriva ut på ett A4-papper. Alla mått i SVG:n ska vara i millimeter. SVG:n består av två cirklar. Den övre cirkeln är "state disk" och används för att mata in en ledtråd för att komma ihåg lösenordet. Om input-specen har `n` tecken har denna skiva `n+1` sektorer, varav en sektor klipps ut och fungerar som ett fönster.

Den nedre cirkeln är "output disk". Denna innehåller alla grupper av tecken från output-specen som normalt har `n+1` grupper separerade med blanksteg.

Lösenordshanteraren skapas genom att man skriver ut illustrationen med cirklarna, klipper ut dem och lägger "state disk" ovanpå "output disk" i ett förutbestämt läge. För att generera lösenordet sätter man sedan fingret vid den symbol på statedisk som är ledtrådens första tecken och roterar fönstret till det här läget och läser av de tecken som står i "output disk" där fönstret befinner sig. Sedan gör man lika dant för följande tecken.

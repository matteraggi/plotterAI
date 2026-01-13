import cv2
import numpy as np
import os

class VectorizationService:
    def vectorize_image(self, input_path: str, epsilon_coeff: float = 0.002) -> str:
        """
        Trasforma l'immagine in percorsi SVG ottimizzati.
        epsilon_coeff: controlla la semplificazione (più alto = meno punti, più "morbido").
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Image not found: {input_path}")
            
        img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"Could not read image: {input_path}")
            
        # Invertiamo: findContours vuole l'oggetto bianco su fondo nero
        inverted = cv2.bitwise_not(img)
        
        # Trova i contorni
        contours, _ = cv2.findContours(inverted, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        height, width = img.shape
        svg_paths = []
        
        for contour in contours:
            # Semplificazione del tracciato (Ramer-Douglas-Peucker)
            # epsilon è la massima distanza tra il contorno originale e la sua approssimazione
            epsilon = epsilon_coeff * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, False)
            
            if len(approx) < 2:
                continue
                
            # Costruzione del path D
            points = approx.reshape(-1, 2)
            path_data = f"M {points[0][0]} {points[0][1]}"
            for i in range(1, len(points)):
                path_data += f" L {points[i][0]} {points[i][1]}"
            
            # NOTA: Per un plotter, spesso NON vogliamo 'Z' (chiusura) 
            # se stiamo disegnando linee aperte scheletrizzate.
            # Se è un cerchio, lo chiuderà l'ultimo punto L che coincide con M.
            
            svg_paths.append(f'<path d="{path_data}" fill="none" stroke="black" stroke-width="1"/>')
        
        # Composizione file SVG
        svg_content = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
            *svg_paths,
            '</svg>'
        ]
        
        output_path = input_path.replace("_processed.png", ".svg").replace(".png", ".svg")
        
        with open(output_path, "w") as f:
            f.write("\n".join(svg_content))
            
        return output_path

vectorization_service = VectorizationService()
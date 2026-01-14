import cv2
import numpy as np
import os
from skimage.morphology import skeletonize
from skimage import util

class ProcessingService:
    def preprocess_image(self, input_path: str) -> str:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Image not found: {input_path}")
            
        # 1. Caricamento
        img = cv2.imread(input_path)
        if img is None:
            raise ValueError(f"Could not read image: {input_path}")
            
        # 2. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 3. Gaussian Blur: Sfoca leggermente per unire i pixel "vicini ma staccati"
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # 4. Otsu Thresholding (Invertito: Oggetto Bianco, Sfondo Nero)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        # 5. Chiusura Morfologica: Tappa i micro-buchi all'interno delle linee
        # Usiamo un kernel ellittico che è più naturale per i tratti a mano
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)

        # 6. Dilatazione leggera per unire tratti molto vicini prima dello scheletro
        dilated = cv2.dilate(closed, kernel, iterations=1)

        # 7. Skeletonization con Scikit-Image (Metodo Lee)
        # Scikit-image vuole un array booleano (True/False) o 0/1.
        # Convertiamo l'immagine OpenCV (0-255) in bool.
        binary_bool = dilated > 127
        
        # Eseguiamo la scheletrizzazione
        skeleton_bool = skeletonize(binary_bool, method='lee')
        
        # Convertiamo di nuovo in uint8 (0-255) per OpenCV
        skeleton_uint8 = util.img_as_ubyte(skeleton_bool)
        
        # 8. Inversione finale per il salvataggio/vettorializzatore
        # Il vettorializzatore si aspetta: Sfondo Bianco, Linee Nere (o viceversa, ma controlliamo vectorization.py)
        # vectorization.py fa: inverted = cv2.bitwise_not(img)
        # Quindi si aspetta Sfondo Bianco (255), Linee Nere (0).
        # skeleton_uint8 ha Linee Bianche (255), Sfondo Nero (0).
        # Quindi dobbiamo invertire.
        final_img = cv2.bitwise_not(skeleton_uint8)
        
        # Determinazione path di output
        dir_name = os.path.dirname(input_path)
        base_name = os.path.basename(input_path)
        name, ext = os.path.splitext(base_name)
        output_filename = f"{name}_processed{ext}"
        output_path = os.path.join(dir_name, output_filename)
        
        cv2.imwrite(output_path, final_img)
        return output_path

    # _skeletonize rimosso perché usiamo skimage

processing_service = ProcessingService()
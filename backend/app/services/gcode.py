import math
import xml.etree.ElementTree as ET
import re
import os

class GCodeService:
    def generate_gcode(self, svg_path: str, target_x: float, target_y: float, 
                       target_width: float, target_height: float, rotation: float,
                       draw_speed: int = 1200, travel_speed: int = 3000) -> str:
        """
        Genera GCode da un file SVG, lo ottimizza e lo salva su disco.
        """
        
        # 1. Parse SVG
        raw_paths = self._parse_svg_paths(svg_path)
        if not raw_paths:
            return ""

        # --- OTTIMIZZAZIONE ---
        # A. Filtro Rumore: Rimuoviamo tratti minuscoli (es. < 0.3mm) che creano solo punti sporchi
        filtered_paths = [p for p in raw_paths if self._path_length(p) > 0.3]
        
        # B. Ordinamento: Minimizziamo le "linee arancioni" (G0) cercando sempre il tratto più vicino
        paths = self._sort_paths(filtered_paths)

        # 2. Calcolo del Bounding Box originale
        orig_min_x, orig_min_y, orig_max_x, orig_max_y = self._get_bounding_box(paths)
        orig_width = orig_max_x - orig_min_x
        orig_height = orig_max_y - orig_min_y
        
        if orig_width == 0 or orig_height == 0:
             return ""

        scale_x = target_width / orig_width
        scale_y = target_height / orig_height
        
        # 3. Generazione stringhe GCode
        gcode = []
        gcode.append("; --- Start of Job ---")
        gcode.append("G21 ; Units in mm")
        gcode.append("G90 ; Absolute positioning")
        gcode.append(f"G0 Z5 F{travel_speed} ; Initial lift")
        
        center_x = (orig_min_x + orig_max_x) / 2
        center_y = (orig_min_y + orig_max_y) / 2
        
        rad = math.radians(rotation)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)

        for path in paths:
            first_point = True
            for x, y in path:
                # Trasformazione
                tx = x - center_x
                ty = y - center_y
                sx = tx * scale_x
                sy = ty * scale_y
                rx = sx * cos_a - sy * sin_a
                ry = sx * sin_a + sy * cos_a
                
                final_x = rx + target_x + (target_width / 2)
                final_y = (ry * -1) + target_y + (target_height / 2) 
                
                if first_point:
                    gcode.append(f"G0 X{final_x:.2f} Y{final_y:.2f} F{travel_speed}")
                    gcode.append(f"G1 Z0 F{draw_speed}")
                    first_point = False
                else:
                    gcode.append(f"G1 X{final_x:.2f} Y{final_y:.2f} F{draw_speed}")
            
            gcode.append(f"G0 Z5 F{travel_speed}")
            
        gcode.append("G28 X0 Y0 ; Home")
        gcode.append("; --- End of Job ---")
        
        gcode_string = "\n".join(gcode)

        # --- SALVATAGGIO FILE ---
        try:
            # Crea il nome file .gcode partendo dal path dell'SVG
            base_path, _ = os.path.splitext(svg_path)
            output_path = f"{base_path}.gcode"
            
            with open(output_path, "w") as f:
                f.write(gcode_string)
            print(f"GCode salvato con successo: {output_path}")
        except Exception as e:
            print(f"Errore durante il salvataggio del GCode: {e}")

        return gcode_string

    def _sort_paths(self, paths):
        """Algoritmo 'Nearest Neighbor' per ridurre i movimenti a vuoto."""
        if not paths: return []
        sorted_p = []
        current_pos = (0, 0)
        remaining = paths[:]
        while remaining:
            idx = 0
            min_d = float('inf')
            for i, p in enumerate(remaining):
                d = math.sqrt((p[0][0]-current_pos[0])**2 + (p[0][1]-current_pos[1])**2)
                if d < min_d:
                    min_d = d
                    idx = i
            p_to_add = remaining.pop(idx)
            sorted_p.append(p_to_add)
            current_pos = p_to_add[-1]
        return sorted_p

    def _path_length(self, path):
        """Calcola la lunghezza totale di un tratto."""
        length = 0
        for i in range(1, len(path)):
            length += math.sqrt((path[i][0]-path[i-1][0])**2 + (path[i][1]-path[i-1][1])**2)
        return length

    def _parse_svg_paths(self, svg_path: str):
        try:
            tree = ET.parse(svg_path)
            root = tree.getroot()
            ns = {'svg': 'http://www.w3.org/2000/svg'}
            paths = []
            elements = root.findall('.//svg:path', ns) + root.findall('.//path')
            for elem in elements:
                d = elem.get('d')
                if not d: continue
                nums = re.findall(r"[-+]?\d*\.\d+|\d+", d)
                pts = []
                for i in range(0, len(nums), 2):
                    if i+1 < len(nums):
                        pts.append((float(nums[i]), float(nums[i+1])))
                if pts: paths.append(pts)
            return paths
        except: return []

    def _get_bounding_box(self, paths):
        all_x = [p[0] for path in paths for p in path]
        all_y = [p[1] for path in paths for p in path]
        return min(all_x), min(all_y), max(all_x), max(all_y)

gcode_service = GCodeService()
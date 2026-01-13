import math
import xml.etree.ElementTree as ET
import re

class GCodeService:
    def generate_gcode(self, svg_path: str, target_x: float, target_y: float, target_width: float, target_height: float, rotation: float) -> str:
        """
        Generates GCode from an SVG file with applied transformations.
        
        Args:
            svg_path: Path to the SVG file.
            target_x: X position on the paper (mm).
            target_y: Y position on the paper (mm).
            target_width: Desired width of the drawing (mm).
            target_height: Desired height of the drawing (mm).
            rotation: Rotation in degrees (clockwise).
            
        Returns:
            String containing the GCode.
        """
        
        # 1. Parse SVG
        paths = self._parse_svg_paths(svg_path)
        if not paths:
            return ""

        # 2. Calculate Scaling
        # We need the original bounding box to calculate scale
        orig_min_x, orig_min_y, orig_max_x, orig_max_y = self._get_bounding_box(paths)
        orig_width = orig_max_x - orig_min_x
        orig_height = orig_max_y - orig_min_y
        
        if orig_width == 0 or orig_height == 0:
             return ""

        scale_x = target_width / orig_width
        scale_y = target_height / orig_height
        
        # Use the smaller scale to maintain aspect ratio if needed, 
        # or just stretch if that's what's requested. 
        # Usually for "width/height" inputs, we might imply stretching or fitting.
        # Let's assume we stretch to fit the box provided by user.
        
        # 3. Generate GCode
        gcode = []
        gcode.append("G21 ; Set units to mm")
        gcode.append("G90 ; Absolute positioning")
        gcode.append("G0 Z5 ; Lift pen")
        
        # Center of the original image for rotation
        center_x = (orig_min_x + orig_max_x) / 2
        center_y = (orig_min_y + orig_max_y) / 2
        
        # Pre-calculate rotation
        rad = math.radians(rotation)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)

        for path in paths:
            first_point = True
            for x, y in path:
                # Transform Coordinate
                
                # 1. Translate to center (for rotation)
                tx = x - center_x
                ty = y - center_y
                
                # 2. Rotate
                rx = tx * cos_a - ty * sin_a
                ry = tx * sin_a + ty * cos_a
                
                # 3. Scale (Apply scale after rotation? Or before? 
                # Usually scale -> rotate -> translate.
                # If we rotate first, the bounding box changes. 
                # Let's Scale -> Rotate -> Translate.
                
                # Re-logic:
                # 1. Normalize to 0,0 based on top-left or center?
                # Let's use the center of the target box.
                
                # Correct Order:
                # 1. Shift so (0,0) is the center of the object.
                tx = x - center_x
                ty = y - center_y
                
                # 2. Scale
                sx = tx * scale_x
                sy = ty * scale_y
                
                # 3. Rotate
                rx = sx * cos_a - sy * sin_a
                ry = sx * sin_a + sy * cos_a
                
                # 4. Translate to final position
                # The user gives x_offset, y_offset as the top-left corner? or center?
                # Let's assume x_offset, y_offset is the Top-Left of the bounding box on the paper.
                # So we need to add (target_width/2) and (target_height/2) to get the center.
                
                final_x = rx + target_x + (target_width / 2)
                final_y = ry + target_y + (target_height / 2)
                
                if first_point:
                    gcode.append(f"G0 X{final_x:.2f} Y{final_y:.2f}")
                    gcode.append("G1 Z0 ; Pen down")
                    first_point = False
                else:
                    gcode.append(f"G1 X{final_x:.2f} Y{final_y:.2f}")
            
            gcode.append("G0 Z5 ; Pen up")
            
        gcode.append("G28 ; Home")
        return "\n".join(gcode)

    def _parse_svg_paths(self, svg_path: str):
        """
        Parses simple SVG paths (M x y L x y ... Z).
        Returns a list of lists of (x, y) tuples.
        """
        tree = ET.parse(svg_path)
        root = tree.getroot()
        
        # Namespace handling
        ns = {'svg': 'http://www.w3.org/2000/svg'}
        
        paths = []
        
        # Find all path elements
        for path_elem in root.findall('.//svg:path', ns) + root.findall('.//path'):
            d = path_elem.get('d')
            if not d:
                continue
                
            # Simple parsing logic for "M x y L x y ... Z"
            # Remove command letters and split
            # This is a very basic parser, assumes the format from vectorization.py
            
            points = []
            parts = d.replace('M', '').replace('L', '').replace('Z', '').split()
            
            # Pair up coordinates
            for i in range(0, len(parts), 2):
                if i + 1 < len(parts):
                    try:
                        x = float(parts[i])
                        y = float(parts[i+1])
                        points.append((x, y))
                    except ValueError:
                        pass
            
            if points:
                paths.append(points)
                
        return paths

    def _get_bounding_box(self, paths):
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')
        
        for path in paths:
            for x, y in path:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
        return min_x, min_y, max_x, max_y

gcode_service = GCodeService()

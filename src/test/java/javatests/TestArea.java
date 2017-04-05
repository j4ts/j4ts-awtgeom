package javatests;

import java.awt.geom.Area;
import java.awt.geom.Rectangle2D;

import sun.awt.geom.AreaOp;

public class TestArea {

  public static void main(String[] args) {

    
    
    Area area = new Area(new Rectangle2D.Double(0, 0, 200, 100));
    System.out.println(area.getBounds2D());
    System.out.println(new Rectangle2D.Double(0, 0, 200, 100).getPathIterator(null));
    
    area.add(new Area(new Rectangle2D.Double(0, 0, 200, 100)));
    
    area.add(new Area(new Rectangle2D.Double(50, -50, 300, 100)));
    // Check area bounds
    Rectangle2D rectangle = area.getBounds2D();
    // assertEquals("Wrong rectangle", 0, rectangle.getX());
    System.out.println(rectangle.getX());
    // assertEquals("Wrong rectangle", -50, rectangle.getY());
    System.out.println(rectangle.getY());
    // assertEquals("Wrong rectangle", 350, rectangle.getWidth());
    System.out.println(rectangle.getWidth());
    // assertEquals("Wrong rectangle", 150, rectangle.getHeight());
    System.out.println(rectangle.getHeight());

  }

}

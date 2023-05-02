<?php
require_once('create_thumbnail.php');

header('Content-type: text/xml');

$start = new DateTime("2022-03-05");
$start->setTimezone(new DateTimeZone('GMT'));
$today = new DateTime("now");
$today->setTimezone(new DateTimeZone('GMT'));

$secondsUntilMidnight = new DateTime("now");
$secondsUntilMidnight->setTimezone(new DateTimeZone('GMT'));
$secondsUntilMidnight->setTime(23,59,59);
$maxage = $today->diff($secondsUntilMidnight)->h*60*60;

header("Cache-Control: public, max-age=".$maxage);

$days = $today->diff($start)->days;
echo "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>";
?>
<rss version="2.0">

    <channel>
        <title>Gordianbla.de Daily Puzzle</title>
        <link>https://www.gordianbla.de</link>
        <description>Daily Netrunner card puzzle</description>
        <language>en</language>
        <lastBuildDate><?php echo($today->format("r"));?></lastBuildDate>
        <pubDate><?php echo($today->format("r"));?></pubDate>

        <?php
            for ($i=$days; $i>=$days-30; $i--) {
                echo("<item>");
                echo("<title>Daily Puzzle #".$i."</title>");
                echo("<link>https://www.gordianbla.de</link>");
                echo("<description>Today's daily puzzle. Give it a try over on https://gordianbla.de !</description>");
                echo("<pubDate>".(clone $start)->modify("+".$i." day")->format("r")."</pubDate>");

                $path = "./daily-puzzles/";
                $png_file = sprintf("thumb/%05d.png", $i);
                if(!file_exists($path.$png_file)) {
                    createThumbnail($i);
                }
                $size = filesize($path.$png_file);
                echo("<enclosure url=\"https://gordianbla.de/daily.php?n=".$i."\" length=\"".$size."\" type=\"image/png\" />");

                echo("</item>");
            }
        ?>
    </channel>

</rss>

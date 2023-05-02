<?php
require_once('create_thumbnail.php');

$start = new DateTime("2022-03-05");
$start->setTimezone(new DateTimeZone('GMT'));
$today = new DateTime("now");
$today->setTimezone(new DateTimeZone('GMT'));

$secondsUntilMidnight = new DateTime("now");
$secondsUntilMidnight->setTimezone(new DateTimeZone('GMT'));
$secondsUntilMidnight->setTime(23,59,59);
$maxage = $today->diff($secondsUntilMidnight)->h*60*60;

header("Cache-Control: public, max-age=".$maxage);
header('Content-type: image/png');

if(isset($_GET["n"])) {
    $days = $_GET["n"];
    if($days > $today->diff($start)->days) {
        $days = $today->diff($start)->days;
    }
} else {
    $days = $today->diff($start)->days;
}

$path = "./daily-puzzles/";
$png_file = sprintf("thumb/%05d.png", $days);

if(!file_exists($png_file)) {
    createThumbnail($days);
}

$data = file_get_contents($path.$png_file);
echo($data);
?>

<?php
header('Content-encoding: gzip');

$start = new DateTime("2020-03-05");
$start->setTimezone(new DateTimeZone('GMT'));
$today = new DateTime("now");
$today->setTimezone(new DateTimeZone('GMT'));

$path = "./daily-puzzles/";
$file = sprintf("%05d.svg.gz", $today->diff($start)->d);
$data = file_get_contents($path.$file);

echo $data;
?>
